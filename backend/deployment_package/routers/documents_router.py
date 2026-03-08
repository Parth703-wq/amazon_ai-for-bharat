import os
import uuid
import logging
from io import BytesIO
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import get_current_user
from aws_services import (
    bedrock_analyze_document,
    upload_document as s3_upload_document,
    delete_document as s3_delete_document,
    generate_presigned_url,
    textract_extract,
)
from config import settings
import PyPDF2
import aiofiles

logger = logging.getLogger("jansahayak")

router = APIRouter(prefix="/documents", tags=["Documents"])

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


async def extract_text_from_file(file_bytes: bytes, content_type: str, filename: str) -> str:
    """Fallback text extraction via PyPDF2 (used when Textract not available)."""
    if "pdf" in content_type:
        try:
            reader = PyPDF2.PdfReader(BytesIO(file_bytes))
            return " ".join(page.extract_text() or "" for page in reader.pages)
        except Exception:
            return ""
    elif content_type.startswith("image/"):
        return f"[Image file: {filename} — AI Vision analysis applied]"
    return ""


@router.post("/upload")
async def upload_document_endpoint(
    file: UploadFile = File(...),
    document_type: str = Form(default="unknown"),
    language: str = Form(default="en"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File too large. Max {settings.MAX_FILE_SIZE_MB}MB")

    ext = os.path.splitext(file.filename or "")[1]
    unique_filename = f"{current_user.id}_{uuid.uuid4().hex}{ext}"

    # ── Upload to S3 (with AES256 + CloudWatch logging) ──────────────────────
    file_path = s3_upload_document(
        content, unique_filename, current_user.id,
        file.content_type or "application/octet-stream"
    )

    # If S3 not configured, save locally
    if file_path.startswith("local://"):
        local_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        async with aiofiles.open(local_path, "wb") as f:
            await f.write(content)
        file_path = local_path

    # ── Feature 2: Run Textract OCR if document is in S3 ─────────────────────
    textract_result: dict = {"extracted_text": "", "lines": [], "confidence": 0.0, "available": False}

    if file_path.startswith("s3://"):
        # Parse bucket + key from s3://bucket/key URI
        s3_path = file_path.replace("s3://", "")
        parts = s3_path.split("/", 1)
        if len(parts) == 2:
            s3_bucket, s3_key = parts
            textract_result = textract_extract(s3_bucket, s3_key)
            logger.info(
                "[Textract] Extracted %d lines at %.1f%% confidence | doc=%s",
                len(textract_result.get("lines", [])),
                textract_result.get("confidence", 0),
                file.filename,
            )

    # ── Get text for AI analysis: prefer Textract output, fallback to PyPDF2 ─
    ocr_text = textract_result.get("extracted_text", "")
    if not ocr_text:
        ocr_text = await extract_text_from_file(content, file.content_type or "", file.filename or "")

    # ── Feature 2: Gemini analysis with Hindi explanation prompt ─────────────
    gemini_analysis_prompt_text = (
        f"Analyze this extracted text from an Indian government document and explain it simply in Hindi.\n\n"
        f"Document Type: {document_type}\n"
        f"Extracted Text:\n{ocr_text or file.filename or 'No text extracted'}"
    )

    # Pass through Bedrock/Gemini AI analysis (falls back to Gemini internally)
    ai_result = await bedrock_analyze_document(
        document_text=gemini_analysis_prompt_text,
        document_type=document_type,
    )

    # ── Save document record to MySQL ─────────────────────────────────────────
    doc = models.UserDocument(
        user_id=current_user.id,
        document_type=ai_result.get("document_type", document_type),
        file_name=file.filename or unique_filename,
        file_path=file_path,
        file_size_kb=len(content) // 1024,
        ocr_extracted_data=ai_result.get("key_fields", {}),
        ai_summary=ai_result.get("summary_simple", ""),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "document_id": doc.id,
        "file_name": doc.file_name,
        "storage": "s3" if "s3://" in file_path else "local",
        "ai_provider": "bedrock" if settings.USE_BEDROCK else "gemini",
        # Feature 2: Textract raw OCR result
        "textract_extracted_text": ocr_text,
        "textract_lines": textract_result.get("lines", []),
        "textract_confidence": textract_result.get("confidence", 0.0),
        "textract_available": textract_result.get("available", False),
        # Existing AI analysis
        "analysis": ai_result,
    }


@router.get("/")
def get_my_documents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    docs = (
        db.query(models.UserDocument)
        .filter(models.UserDocument.user_id == current_user.id)
        .order_by(models.UserDocument.created_at.desc())
        .all()
    )
    results = []
    for d in docs:
        # Generate presigned URL if stored in S3
        access_url = None
        if d.file_path and "s3://" in d.file_path:
            access_url = generate_presigned_url(d.file_path)

        results.append({
            "id": d.id,
            "document_type": d.document_type,
            "file_name": d.file_name,
            "file_size_kb": d.file_size_kb,
            "ai_summary": d.ai_summary,
            "ocr_data": d.ocr_extracted_data,
            "is_verified": d.is_verified,
            "storage_type": "s3" if d.file_path and "s3://" in d.file_path else "local",
            "access_url": access_url,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        })
    return results


@router.delete("/{document_id}")
def delete_document_endpoint(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    doc = db.query(models.UserDocument).filter(
        models.UserDocument.id == document_id,
        models.UserDocument.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete from S3 or local
    if doc.file_path and "s3://" in doc.file_path:
        s3_delete_document(doc.file_path)
    elif doc.file_path and os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}
