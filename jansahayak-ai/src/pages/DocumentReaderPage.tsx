import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
    Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2,
    FolderOpen, ScanText, Sparkles, ChevronRight,
} from 'lucide-react';

import { documentsApi, type UserDocument, type DocumentAnalysis, type DocumentUploadResult } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const DOC_TYPES = [
    'Aadhaar Card', 'PAN Card', 'Voter ID', 'Income Certificate',
    'Caste Certificate', 'Land Record (Khatauni)', 'Ration Card',
    'Bank Passbook', 'Birth Certificate', 'Other',
];

// ── Feature 2: Two-tab analysis view ────────────────────────────────────────
type AnalysisTab = 'raw' | 'ai';

interface AnalysisResultPanelProps {
    uploadResult: DocumentUploadResult;
    analysis: DocumentAnalysis;
}

const AnalysisResultPanel: React.FC<AnalysisResultPanelProps> = ({ uploadResult, analysis }) => {
    const [activeTab, setActiveTab] = useState<AnalysisTab>('ai');

    const lines = uploadResult.textract_lines ?? [];
    const rawText = uploadResult.textract_extracted_text ?? '';
    const confidence = uploadResult.textract_confidence ?? 0;
    const textractAvailable = uploadResult.textract_available;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-green-200 bg-green-50/30">
                <CardContent className="p-6">

                    {/* Result header */}
                    <div className="flex items-center gap-2 mb-5">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h3 className="font-bold text-gray-900">Analysis Complete</h3>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            {analysis.document_type}
                        </span>
                        {textractAvailable && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                <ScanText className="h-3 w-3" />
                                Textract OCR · {confidence.toFixed(1)}% confidence
                            </span>
                        )}
                    </div>

                    {/* ── Feature 2 Tab switcher ─────────────────────────── */}
                    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
                        <button
                            onClick={() => setActiveTab('ai')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'ai'
                                    ? 'bg-white shadow text-primary'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            AI Explanation
                        </button>
                        <button
                            onClick={() => setActiveTab('raw')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'raw'
                                    ? 'bg-white shadow text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <ScanText className="h-3.5 w-3.5" />
                            Raw Text
                            {lines.length > 0 && (
                                <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1.5 rounded-full">
                                    {lines.length}
                                </span>
                            )}
                        </button>
                    </div>

                    <AnimatePresence mode="wait">

                        {/* ── Tab 2: AI Explanation (Gemini Hindi analysis) ── */}
                        {activeTab === 'ai' && (
                            <motion.div
                                key="ai"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-4"
                            >
                                {/* Summary */}
                                <div className="bg-white rounded-xl p-4 border border-gray-100">
                                    <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                        AI Summary (Gemini)
                                    </p>
                                    <p className="text-gray-800 leading-relaxed">{analysis.summary_simple}</p>
                                </div>

                                {/* Key fields grid */}
                                {Object.keys(analysis.key_fields || {}).length > 0 && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(analysis.key_fields || {}).map(([k, v]) => (
                                            <div key={k} className="bg-white rounded-lg p-3 border border-gray-100">
                                                <p className="text-xs text-gray-500 capitalize mb-0.5">
                                                    {k.replace(/_/g, ' ')}
                                                </p>
                                                <p className="font-semibold text-gray-900 text-sm">{String(v)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Eligible schemes */}
                                {(analysis.eligible_schemes?.length ?? 0) > 0 && (
                                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                                        <p className="text-sm font-semibold text-primary mb-2">
                                            Schemes you may qualify for:
                                        </p>
                                        <ul className="space-y-1">
                                            {analysis.eligible_schemes.map((s, i) => (
                                                <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                                                    <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Warnings */}
                                {(analysis.warnings?.length ?? 0) > 0 && (
                                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                                        {analysis.warnings.map((w, i) => (
                                            <p key={i} className="text-sm text-amber-800 flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4 shrink-0" />
                                                {w}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ── Tab 1: Raw Text (Textract extracted fields) ── */}
                        {activeTab === 'raw' && (
                            <motion.div
                                key="raw"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-4"
                            >
                                {/* Textract availability badge */}
                                {!textractAvailable && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        Amazon Textract not available (no S3 or AWS credentials). Showing text extracted by PyPDF2.
                                    </div>
                                )}

                                {/* Line-by-line table */}
                                {lines.length > 0 ? (
                                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                                                <ScanText className="h-3.5 w-3.5" />
                                                Textract Extracted Lines
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Avg confidence: <span className="font-semibold text-blue-600">{confidence.toFixed(1)}%</span>
                                            </p>
                                        </div>
                                        <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                                            {lines.map((line, i) => (
                                                <div key={i} className="px-4 py-2 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                                                    <span className="text-xs text-gray-400 font-mono w-6 shrink-0 mt-0.5">{i + 1}</span>
                                                    <span className="text-sm text-gray-800">{line}</span>
                                                    <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0 ml-auto mt-0.5" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : rawText ? (
                                    /* Fallback raw text block */
                                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                Extracted Text (PyPDF2 fallback)
                                            </p>
                                        </div>
                                        <pre className="p-4 text-sm text-gray-700 whitespace-pre-wrap font-sans max-h-72 overflow-y-auto leading-relaxed">
                                            {rawText}
                                        </pre>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-400">
                                        <ScanText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                        <p className="text-sm">No text was extracted from this document.</p>
                                        <p className="text-xs mt-1 text-gray-300">Try uploading a clearer image or PDF.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    );
};


// ── Main Page ────────────────────────────────────────────────────────────────
export const DocumentReaderPage = () => {
    const { isLoggedIn } = useAuthStore();
    const navigate = useNavigate();

    const [uploading, setUploading] = useState(false);
    const [docType, setDocType] = useState('Aadhaar Card');
    const [uploadResult, setUploadResult] = useState<DocumentUploadResult | null>(null);
    const [myDocs, setMyDocs] = useState<UserDocument[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [error, setError] = useState('');
    const [tab, setTab] = useState<'upload' | 'my-docs'>('upload');

    const loadMyDocs = async () => {
        setLoadingDocs(true);
        try {
            setMyDocs(await documentsApi.getMyDocuments());
        } catch {
            setError('Could not load documents');
        } finally {
            setLoadingDocs(false);
        }
    };

    const onDrop = useCallback(async (files: File[]) => {
        if (!isLoggedIn) { navigate('/auth'); return; }
        if (!files.length) return;
        setUploading(true);
        setUploadResult(null);
        setError('');
        try {
            const res = await documentsApi.upload(files[0], docType);
            setUploadResult(res);
        } catch (e: unknown) {
            setError((e as Error).message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    }, [isLoggedIn, docType, navigate]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] },
        maxFiles: 1,
    });

    const deleteDoc = async (id: number) => {
        try {
            await documentsApi.deleteDocument(id);
            setMyDocs(prev => prev.filter(d => d.id !== id));
        } catch {
            setError('Could not delete');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="container mx-auto px-4 max-w-4xl">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Document Reader</h1>
                    <p className="text-gray-600 mt-1">
                        Upload government documents — Textract OCR extracts text, Gemini explains it in Hindi
                    </p>
                </div>

                {/* Page-level tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
                    {(['upload', 'my-docs'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => { setTab(t); if (t === 'my-docs') loadMyDocs(); }}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t
                                    ? 'bg-white shadow text-primary'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {t === 'upload' ? 'Upload Document' : 'My Documents'}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">

                    {/* ── Upload Tab ── */}
                    {tab === 'upload' && (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Doc type selector */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-2">
                                    Document Type
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {DOC_TYPES.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setDocType(t)}
                                            className={`px-3 py-1.5 rounded-full text-sm transition-all border ${docType === t
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-primary/50'
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dropzone */}
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragActive
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
                                    } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                            >
                                <input {...getInputProps()} />
                                {uploading ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                        <p className="font-medium text-gray-700">
                                            Uploading · Textract OCR · Gemini analysis...
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                                            <span className="flex items-center gap-1">
                                                <ScanText className="h-3.5 w-3.5" /> Extracting text
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Sparkles className="h-3.5 w-3.5" /> AI analysis
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-lg font-semibold text-gray-700">
                                            {isDragActive ? 'Drop it here!' : 'Drag & drop or click to upload'}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-2">PDF, JPG, PNG · Max 10MB</p>
                                        {!isLoggedIn && (
                                            <p className="text-sm text-amber-600 mt-3 font-medium">
                                                ⚠ Please sign in to upload documents
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Feature 2: Two-tab analysis result */}
                            {uploadResult && uploadResult.analysis && (
                                <AnalysisResultPanel
                                    uploadResult={uploadResult}
                                    analysis={uploadResult.analysis}
                                />
                            )}
                        </motion.div>
                    )}

                    {/* ── My Documents Tab ── */}
                    {tab === 'my-docs' && (
                        <motion.div
                            key="my-docs"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {!isLoggedIn ? (
                                <div className="text-center py-16">
                                    <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 mb-4">Sign in to view your documents</p>
                                    <Button onClick={() => navigate('/auth')}>Sign In</Button>
                                </div>
                            ) : loadingDocs ? (
                                <div className="flex justify-center py-16">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : myDocs.length === 0 ? (
                                <div className="text-center py-16">
                                    <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No documents uploaded yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {myDocs.map(doc => (
                                        <Card key={doc.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                                                    <FileText className="h-6 w-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate">{doc.file_name}</p>
                                                    <div className="flex items-center gap-3 mt-0.5">
                                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                            {doc.document_type}
                                                        </span>
                                                        <span className="text-xs text-gray-400">{doc.file_size_kb} KB</span>
                                                        {doc.storage_type === 's3' && (
                                                            <span className="text-xs text-green-600 font-medium">☁ S3</span>
                                                        )}
                                                    </div>
                                                    {doc.ai_summary && (
                                                        <p className="text-xs text-gray-500 mt-1 truncate">{doc.ai_summary}</p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => deleteDoc(doc.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};
