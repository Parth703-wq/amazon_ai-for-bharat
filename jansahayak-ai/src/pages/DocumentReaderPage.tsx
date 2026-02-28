import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2, Eye, Download, FolderOpen } from 'lucide-react';
import { documentsApi, type UserDocument, type DocumentAnalysis } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const DOC_TYPES = [
    'Aadhaar Card', 'PAN Card', 'Voter ID', 'Income Certificate',
    'Caste Certificate', 'Land Record (Khatauni)', 'Ration Card',
    'Bank Passbook', 'Birth Certificate', 'Other'
];

export const DocumentReaderPage = () => {
    const { isLoggedIn } = useAuthStore();
    const navigate = useNavigate();
    const [uploading, setUploading] = useState(false);
    const [docType, setDocType] = useState('Aadhaar Card');
    const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
    const [myDocs, setMyDocs] = useState<UserDocument[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [error, setError] = useState('');
    const [tab, setTab] = useState<'upload' | 'my-docs'>('upload');

    const loadMyDocs = async () => {
        setLoadingDocs(true);
        try {
            const docs = await documentsApi.getMyDocuments();
            setMyDocs(docs);
        } catch (e) {
            setError('Could not load documents');
        } finally {
            setLoadingDocs(false);
        }
    };

    const onDrop = useCallback(async (files: File[]) => {
        if (!isLoggedIn) {
            navigate('/auth');
            return;
        }
        if (!files.length) return;
        setUploading(true);
        setAnalysis(null);
        setError('');
        try {
            const res = await documentsApi.upload(files[0], docType);
            setAnalysis(res.analysis);
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
        } catch (e) {
            setError('Could not delete');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Document Reader</h1>
                    <p className="text-gray-600 mt-1">Upload government documents — AI extracts and explains everything for you</p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-primary font-medium">
                        <CheckCircle className="h-4 w-4" /> Files stored securely in Amazon S3 · AES-256 encrypted
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
                    {(['upload', 'my-docs'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => { setTab(t); if (t === 'my-docs') loadMyDocs(); }}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t === 'upload' ? 'Upload Document' : 'My Documents'}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {tab === 'upload' && (
                        <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                            {/* Doc type selector */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-2">Document Type</label>
                                <div className="flex flex-wrap gap-2">
                                    {DOC_TYPES.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setDocType(t)}
                                            className={`px-3 py-1.5 rounded-full text-sm transition-all border ${docType === t ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-600 hover:border-primary/50'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dropzone */}
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
                                    } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                            >
                                <input {...getInputProps()} />
                                {uploading ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                        <p className="font-medium text-gray-700">Uploading to S3 · Analyzing with AI...</p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-lg font-semibold text-gray-700">{isDragActive ? 'Drop it here!' : 'Drag & drop or click to upload'}</p>
                                        <p className="text-sm text-gray-500 mt-2">PDF, JPG, PNG · Max 10MB</p>
                                        {!isLoggedIn && <p className="text-sm text-amber-600 mt-3 font-medium">⚠ Please sign in to upload documents</p>}
                                    </>
                                )}
                            </div>

                            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

                            {/* Analysis Result */}
                            {analysis && (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                    <Card className="border-success/30 bg-success/5">
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <CheckCircle className="h-5 w-5 text-success" />
                                                <h3 className="font-bold text-gray-900">Analysis Complete</h3>
                                                <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full font-medium">{analysis.document_type}</span>
                                            </div>

                                            <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
                                                <p className="text-sm font-semibold text-gray-500 mb-1">AI Summary</p>
                                                <p className="text-gray-800">{analysis.summary_simple}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                {Object.entries(analysis.key_fields || {}).map(([k, v]) => (
                                                    <div key={k} className="bg-white rounded-lg p-3 border border-gray-100">
                                                        <p className="text-xs text-gray-500 capitalize">{k.replace(/_/g, ' ')}</p>
                                                        <p className="font-semibold text-gray-900 text-sm">{String(v)}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {analysis.eligible_schemes?.length > 0 && (
                                                <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                                                    <p className="text-sm font-semibold text-primary mb-2">Schemes you may qualify for:</p>
                                                    <ul className="space-y-1">
                                                        {analysis.eligible_schemes.map((s, i) => (
                                                            <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                                                                <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" /> {s}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {analysis.warnings?.length > 0 && (
                                                <div className="mt-3 bg-amber-50 rounded-xl p-4 border border-amber-200">
                                                    {analysis.warnings.map((w, i) => (
                                                        <p key={i} className="text-sm text-amber-800 flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" /> {w}</p>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {tab === 'my-docs' && (
                        <motion.div key="my-docs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {!isLoggedIn ? (
                                <div className="text-center py-16">
                                    <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 mb-4">Sign in to view your documents</p>
                                    <Button onClick={() => navigate('/auth')}>Sign In</Button>
                                </div>
                            ) : loadingDocs ? (
                                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
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
                                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{doc.document_type}</span>
                                                        <span className="text-xs text-gray-400">{doc.file_size_kb} KB</span>
                                                        {doc.storage_type === 's3' && <span className="text-xs text-success font-medium">☁ S3</span>}
                                                    </div>
                                                    {doc.ai_summary && <p className="text-xs text-gray-500 mt-1 truncate">{doc.ai_summary}</p>}
                                                </div>
                                                <button onClick={() => deleteDoc(doc.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
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
