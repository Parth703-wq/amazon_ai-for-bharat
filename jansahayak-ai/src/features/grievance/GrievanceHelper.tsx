import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Send, Loader2, ClipboardList, Search, ChevronRight } from 'lucide-react';
import { grievancesApi, type GrievanceResponse } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const CATEGORIES = [
    'PM Kisan Payment Pending',
    'Aadhaar Link Problem',
    'Ration Card Issue',
    'PM Awas Application Rejected',
    'MGNREGA Wages Not Received',
    'Scholarship Not Credited',
    'Pension Not Received',
    'PMJAY Health Card Issue',
    'Other Government Scheme Issue',
];

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    Submitted: { color: 'bg-blue-100 text-blue-700', label: 'Submitted' },
    'Under Review': { color: 'bg-yellow-100 text-yellow-700', label: 'Under Review' },
    Actioned: { color: 'bg-purple-100 text-purple-700', label: 'Actioned' },
    Resolved: { color: 'bg-green-100 text-green-700', label: 'Resolved' },
    Closed: { color: 'bg-gray-100 text-gray-700', label: 'Closed' },
};

export const GrievanceHelper = () => {
    const { isLoggedIn } = useAuthStore();
    const navigate = useNavigate();
    const [tab, setTab] = useState<'submit' | 'track' | 'my'>('submit');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState<{ ticket_id: string; message: string } | null>(null);
    const [error, setError] = useState('');
    const [trackId, setTrackId] = useState('');
    const [trackedGrievance, setTrackedGrievance] = useState<GrievanceResponse | null>(null);
    const [myGrievances, setMyGrievances] = useState<GrievanceResponse[]>([]);
    const [loadingMy, setLoadingMy] = useState(false);

    const loadMyGrievances = async () => {
        setLoadingMy(true);
        try {
            const data = await grievancesApi.getMyGrievances();
            setMyGrievances(data);
        } catch { }
        finally { setLoadingMy(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoggedIn) { navigate('/auth'); return; }
        if (!category || !description) { setError('Please fill all fields'); return; }
        setLoading(true); setError('');
        try {
            const res = await grievancesApi.create({ category, description });
            setSubmitted({ ticket_id: res.ticket_id, message: res.message || 'Grievance registered successfully!' });
            setCategory(''); setDescription('');
        } catch (e: unknown) {
            setError((e as Error).message || 'Submission failed. Please try again.');
        } finally { setLoading(false); }
    };

    const handleTrack = async () => {
        if (!trackId.trim()) return;
        setLoading(true); setError('');
        try {
            const data = await grievancesApi.track(trackId.trim().toUpperCase());
            setTrackedGrievance(data);
        } catch {
            setError('Ticket not found. Please check the ID.');
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Grievance Portal</h1>
                    <p className="text-gray-600 mt-1">File complaints, track status, and get resolution for government scheme issues</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
                    {([['submit', 'File Complaint'], ['track', 'Track Status'], ['my', 'My Grievances']] as const).map(([t, label]) => (
                        <button
                            key={t}
                            onClick={() => { setTab(t as typeof tab); if (t === 'my') loadMyGrievances(); }}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* FILE COMPLAINT */}
                    {tab === 'submit' && (
                        <motion.div key="submit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {submitted ? (
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                    <Card className="border-success/30 bg-success/5">
                                        <CardContent className="p-8 text-center">
                                            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Complaint Filed!</h3>
                                            <p className="text-gray-600 mb-6">{submitted.message}</p>
                                            <div className="bg-white rounded-xl p-4 border border-success/30 mb-6">
                                                <p className="text-sm text-gray-500 mb-1">Your Ticket ID</p>
                                                <p className="text-2xl font-bold font-mono text-primary tracking-wider">{submitted.ticket_id}</p>
                                                <p className="text-xs text-gray-400 mt-2">Save this ID to track your complaint status</p>
                                            </div>
                                            <Button onClick={() => setSubmitted(null)} variant="outline" className="w-full">
                                                File Another Complaint
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ) : (
                                <Card>
                                    <CardContent className="p-6">
                                        <form onSubmit={handleSubmit} className="space-y-5">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Issue Category</label>
                                                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                                                    {CATEGORIES.map(cat => (
                                                        <label key={cat} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${category === cat ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/40'}`}>
                                                            <input type="radio" name="category" value={cat} className="accent-primary" checked={category === cat} onChange={() => setCategory(cat)} />
                                                            <span className="text-sm text-gray-700">{cat}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Describe Your Issue</label>
                                                <textarea
                                                    rows={4}
                                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                                    placeholder="Describe your problem in detail — e.g., PM Kisan installment not received since 3 months, Aadhaar linked but amount not credited..."
                                                    value={description}
                                                    onChange={e => setDescription(e.target.value)}
                                                    required
                                                />
                                                <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/500</p>
                                            </div>

                                            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

                                            {!isLoggedIn && (
                                                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
                                                    Please <button type="button" onClick={() => navigate('/auth')} className="underline font-semibold">sign in</button> to file a grievance and get a real ticket ID.
                                                </div>
                                            )}

                                            <Button type="submit" size="lg" className="w-full" isLoading={loading}>
                                                <Send className="h-5 w-5 mr-2" /> Submit Grievance
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    )}

                    {/* TRACK */}
                    {tab === 'track' && (
                        <motion.div key="track" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Card className="mb-4">
                                <CardContent className="p-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Enter Ticket ID</label>
                                    <div className="flex gap-3">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm font-mono uppercase"
                                                placeholder="GRV-XXXXXXXX"
                                                value={trackId}
                                                onChange={e => setTrackId(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleTrack()}
                                            />
                                        </div>
                                        <Button onClick={handleTrack} isLoading={loading} disabled={!trackId.trim()}>Track</Button>
                                    </div>
                                    {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
                                </CardContent>
                            </Card>

                            {trackedGrievance && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <p className="font-mono text-lg font-bold text-primary">{trackedGrievance.ticket_id}</p>
                                                    <p className="text-sm text-gray-600 mt-1">{trackedGrievance.category}</p>
                                                </div>
                                                <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${STATUS_CONFIG[trackedGrievance.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                                                    {trackedGrievance.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4">{trackedGrievance.description}</p>
                                            {trackedGrievance.resolution_notes && (
                                                <div className="mt-4 bg-success/5 border border-success/30 rounded-xl p-4">
                                                    <p className="text-xs font-semibold text-success mb-1">Resolution Notes</p>
                                                    <p className="text-sm text-gray-700">{trackedGrievance.resolution_notes}</p>
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-400 mt-4">Filed: {trackedGrievance.created_at ? new Date(trackedGrievance.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* MY GRIEVANCES */}
                    {tab === 'my' && (
                        <motion.div key="my" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {!isLoggedIn ? (
                                <div className="text-center py-16">
                                    <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 mb-4">Sign in to see your complaints</p>
                                    <Button onClick={() => navigate('/auth')}>Sign In</Button>
                                </div>
                            ) : loadingMy ? (
                                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                            ) : myGrievances.length === 0 ? (
                                <div className="text-center py-16">
                                    <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 mb-2">No complaints filed yet</p>
                                    <button onClick={() => setTab('submit')} className="text-primary text-sm hover:underline">File your first complaint</button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {myGrievances.map(g => (
                                        <Card key={g.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-mono text-sm font-bold text-primary">{g.ticket_id}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[g.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                                                            {g.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 font-medium">{g.category}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{g.created_at ? new Date(g.created_at).toLocaleDateString('en-IN') : ''}</p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-gray-400" />
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
