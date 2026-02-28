from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from database import get_db
import models
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    full_name: str
    phone: str
    email: Optional[EmailStr] = None
    password: str
    preferred_language: str = "hi"
    state: Optional[str] = None


class LoginRequest(BaseModel):
    phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: str
    role: str


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    # Check existing phone
    if db.query(models.User).filter(models.User.phone == data.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")

    user = models.User(
        full_name=data.full_name,
        phone=data.phone,
        email=data.email,
        hashed_password=hash_password(data.password),
        preferred_language=data.preferred_language,
        state=data.state,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        full_name=user.full_name,
        role=user.role.value,
    )


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.phone == data.phone).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid phone number or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        full_name=user.full_name,
        role=user.role.value,
    )


@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "email": current_user.email,
        "preferred_language": current_user.preferred_language,
        "state": current_user.state,
        "district": current_user.district,
        "annual_income": current_user.annual_income,
        "role": current_user.role.value,
        "is_verified": current_user.is_verified,
        "profile_complete": current_user.profile_complete,
    }


@router.put("/profile")
def update_profile(
    updates: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    allowed_fields = [
        "full_name", "email", "preferred_language", "state", "district",
        "annual_income", "caste_category", "land_holdings_hectares", "aadhaar_last4"
    ]
    for field in allowed_fields:
        if field in updates:
            setattr(current_user, field, updates[field])

    # Check if profile is now complete
    if all([current_user.state, current_user.annual_income]):
        current_user.profile_complete = True

    db.commit()
    db.refresh(current_user)
    return {"message": "Profile updated successfully"}
