import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    User, MapPin, IndianRupee, Edit3, Save, CheckCircle,
    LogOut, Shield, Loader2, X, Bookmark, Search, Sparkles,
    FileText, AlertTriangle, MessageCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { authApi, schemesApi, type SchemeResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const STATES = [
    'Andhra Pradesh', 'Bihar', 'Chhattisgarh', 'Delhi', 'Gujarat', 'Haryana', 'Himachal Pradesh',
    'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab',
    'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];
const CASTE_CATS = ['General', 'OBC', 'SC', 'ST', 'EWS'];

// Profile completion steps shown when < 80%
const PROFILE_STEPS = [
    { key: 'state', label: 'Add your State', hint: 'Unlock state-specific schemes', icon: MapPin },
    { key: 'annual_income', label: 'Add Annual Income', hint: 'Get income-based scheme matches', icon: IndianRupee },
    { key: 'caste_category', label: 'Add Caste Category', hint: 'Find reserved category schemes', icon: Shield },
    { key: 'district', label: 'Add District', hint: 'Find nearest offices & schemes', icon: MapPin },
];

// Saved schemes from localStorage
const SAVED_KEY = 'jansahayak_saved_schemes';
function getSavedIds(): number[] { try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch { return []; } }

type Tab = 'profile' | 'saved';

export const ProfilePage = () => {
    const { user, isLoggedIn, logout, refreshUser, updateUser } = useAuthStore();
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState<Record<string, string | number>>({});
    const [tab, setTab] = useState<Tab>('profile');
    const [savedSchemes, setSavedSchemes] = useState<SchemeResponse[]>([]);
    const [loadingSaved, setLoadingSaved] = useState(false);
    const [matchLoading, setMatchLoading] = useState(false);
    const [matchedSchemes, setMatchedSchemes] = useState<SchemeResponse[]>([]);
    const [showMatchModal, setShowMatchModal] = useState(false);

    useEffect(() => {
        if (!isLoggedIn) { navigate('/auth'); return; }
        refreshUser();
    }, []);

    useEffect(() => {
        if (user) {
            setForm({
                full_name: user.full_name || '',
                state: user.state || '',
                district: user.district || '',
                annual_income: user.annual_income || '',
                caste_category: (user as unknown as Record<string, string>).caste_category || '',
                preferred_language: user.preferred_language || 'en',
            });
        }
    }, [user]);

    // Load saved schemes when tab switches to saved
    useEffect(() => {
        if (tab !== 'saved') return;
        const ids = getSavedIds();
        if (ids.length === 0) { setSavedSchemes([]); return; }
        setLoadingSaved(true);
        schemesApi.getSchemes({ limit: 100 })

            .then(res => setSavedSchemes((res.schemes || []).filter((s: SchemeResponse) => ids.includes(s.id))))
            .catch(() => setSavedSchemes([]))
            .finally(() => setLoadingSaved(false));
    }, [tab]);

    const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));


    const save = async () => {
        setSaving(true);
        try {
            await authApi.updateProfile(form);
            updateUser(form as unknown as Parameters<typeof updateUser>[0]);

            setEditing(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error(e);
        } finally { setSaving(false); }
    };

    const handleFindSchemes = async () => {
        setMatchLoading(true);
        try {
            const res = await schemesApi.aiMatch();
            setMatchedSchemes(res.schemes || []);
            setShowMatchModal(true);
        } catch {
            // fallback: redirect to schemes page
            navigate('/schemes');
        } finally { setMatchLoading(false); }
    };

    if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    const userRecord = user as unknown as Record<string, unknown>;
    const completionPct = [user.state, user.annual_income, userRecord.caste_category, user.district]
        .filter(Boolean).length * 25;

    const missingSteps = PROFILE_STEPS.filter(s => !userRecord[s.key] && !form[s.key]);

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="container mx-auto px-4 max-w-3xl">

                {/* Profile Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="mb-6 overflow-hidden">
                        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                                    {user.full_name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-xl font-bold">{user.full_name}</h1>
                                    <p className="text-white/70 text-sm">{user.phone}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {user.is_verified && (
                                            <span className="text-xs bg-success/30 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" /> Verified
                                            </span>
                                        )}
                                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { logout(); navigate('/'); }}
                                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Profile completion bar */}
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="font-semibold text-gray-700">Profile Completion</span>
                                <span className={`font-bold ${completionPct === 100 ? 'text-success' : 'text-amber-500'}`}>{completionPct}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${completionPct === 100 ? 'bg-success' : 'bg-amber-400'}`}
                                    style={{ width: `${completionPct}%` }}
                                />
                            </div>
                            {completionPct < 100 && (
                                <p className="text-xs text-gray-500 mt-1">Complete your profile to get personalized scheme matches</p>
                            )}
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100">
                            {(['profile', 'saved'] as Tab[]).map(t => (
                                <button key={t} onClick={() => setTab(t)}
                                    className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${tab === t ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-600'}`}>
                                    {t === 'saved' ? '🔖 Saved Schemes' : '👤 Profile'}
                                </button>
                            ))}
                        </div>
                    </Card>
                </motion.div>

                {/* ── Profile Tab ── */}
                {tab === 'profile' && (
                    <>
                        {/* Profile completion steps — only when < 80% */}
                        {completionPct < 80 && missingSteps.length > 0 && (
                            <Card className="mb-6 border-amber-200 bg-amber-50">
                                <CardContent className="p-4">
                                    <p className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-1.5">
                                        <Sparkles className="h-4 w-4" /> Complete your profile for better matches
                                    </p>
                                    <div className="space-y-2">
                                        {missingSteps.map(step => (
                                            <button key={step.key} onClick={() => setEditing(true)}
                                                className="w-full flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-amber-100 hover:border-primary/30 hover:shadow-sm transition-all text-left group">
                                                <step.icon className="h-4 w-4 text-amber-500 shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-gray-800 group-hover:text-primary">{step.label}</p>
                                                    <p className="text-xs text-gray-500">{step.hint}</p>
                                                </div>
                                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">+25%</span>
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Find My Eligible Schemes button */}
                        {completionPct >= 50 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                                <button
                                    onClick={handleFindSchemes}
                                    disabled={matchLoading}
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-white rounded-2xl py-4 font-bold text-base shadow-md hover:shadow-lg transition-all hover:opacity-95 disabled:opacity-70"
                                >
                                    {matchLoading
                                        ? <><Loader2 className="h-5 w-5 animate-spin" /> Matching your profile...</>
                                        : <><Sparkles className="h-5 w-5" /> Find My Eligible Schemes</>}
                                </button>
                            </motion.div>
                        )}

                        {/* Personal Info Card */}
                        <Card>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <h2 className="font-bold text-gray-900">Personal Information</h2>
                                {!editing ? (
                                    <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                                        <Edit3 className="h-4 w-4 mr-1" /> Edit
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                                            <X className="h-4 w-4 mr-1" /> Cancel
                                        </Button>
                                        <Button size="sm" onClick={save} isLoading={saving}>
                                            <Save className="h-4 w-4 mr-1" /> Save
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {[
                                    { label: 'Full Name', key: 'full_name', icon: <User className="h-4 w-4" />, type: 'text' },
                                    { label: 'State', key: 'state', icon: <MapPin className="h-4 w-4" />, type: 'state' },
                                    { label: 'District', key: 'district', icon: <MapPin className="h-4 w-4" />, type: 'text' },
                                    { label: 'Annual Income (₹)', key: 'annual_income', icon: <IndianRupee className="h-4 w-4" />, type: 'number' },
                                    { label: 'Caste Category', key: 'caste_category', icon: <Shield className="h-4 w-4" />, type: 'caste' },
                                ].map(field => (
                                    <div key={field.key}>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                            {field.icon} {field.label}
                                        </label>
                                        {editing ? (
                                            field.type === 'state' ? (
                                                <select className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:border-primary outline-none"
                                                    value={form.state as string} onChange={e => set('state', e.target.value)}>
                                                    <option value="">Select state</option>
                                                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            ) : field.type === 'caste' ? (
                                                <select className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:border-primary outline-none"
                                                    value={form.caste_category as string} onChange={e => set('caste_category', e.target.value)}>
                                                    <option value="">Select category</option>
                                                    {CASTE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            ) : (
                                                <input className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-primary outline-none"
                                                    type={field.type} value={form[field.key] as string || ''} onChange={e => set(field.key, e.target.value)} />
                                            )
                                        ) : (
                                            <p className="text-gray-900 font-medium">{userRecord[field.key] as string || <span className="text-gray-400 italic">Not set</span>}</p>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                            {saved && (
                                <div className="mx-6 mb-6 bg-success/10 border border-success/30 text-success rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" /> Profile saved successfully!
                                </div>
                            )}
                        </Card>

                        {/* Quick Actions */}
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            {[
                                { label: 'Find My Schemes', path: '/schemes', color: 'bg-primary text-white', icon: <Search className="h-4 w-4" /> },
                                { label: 'My Grievances', path: '/grievance', color: 'bg-red-50 text-red-700', icon: <AlertTriangle className="h-4 w-4" /> },
                                { label: 'My Documents', path: '/documents', color: 'bg-green-50 text-green-700', icon: <FileText className="h-4 w-4" /> },
                                { label: 'AI Assistant', path: '/chat', color: 'bg-purple-50 text-purple-700', icon: <MessageCircle className="h-4 w-4" /> },
                            ].map(a => (
                                <button key={a.path} onClick={() => navigate(a.path)}
                                    className={`rounded-2xl p-4 text-left font-semibold text-sm hover:opacity-90 transition-opacity ${a.color} flex items-center gap-2`}>
                                    {a.icon} {a.label}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* ── Saved Tab ── */}
                {tab === 'saved' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {loadingSaved ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : savedSchemes.length === 0 ? (
                            <div className="text-center py-20">
                                <Bookmark className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-700 font-semibold text-lg">No saved schemes yet</p>
                                <p className="text-sm text-gray-400 mt-1 mb-6">Bookmark schemes from the Find Schemes page</p>
                                <button onClick={() => navigate('/schemes')}
                                    className="px-6 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                                    Browse Schemes
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {savedSchemes.map(scheme => (
                                    <motion.div key={scheme.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="hover:shadow-md transition-all hover:border-primary/30 cursor-pointer"
                                            onClick={() => navigate('/schemes')}>
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <Bookmark className="h-4 w-4 text-primary mt-1 shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="font-bold text-gray-900 text-sm">{scheme.name}</p>
                                                        {scheme.benefit_amount && (
                                                            <p className="text-green-700 font-semibold text-sm mt-0.5">₹ {scheme.benefit_amount}</p>
                                                        )}
                                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-1 inline-block capitalize">{scheme.category}</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Scheme Match Modal */}
            {showMatchModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
                    onClick={() => setShowMatchModal(false)}>
                    <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        className="bg-white w-full md:max-w-xl max-h-[85vh] overflow-y-auto rounded-t-3xl md:rounded-3xl shadow-2xl"
                        onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
                            <div>
                                <h2 className="font-bold text-gray-900">Your Eligible Schemes</h2>
                                <p className="text-xs text-gray-500 mt-0.5">{matchedSchemes.length} schemes matched your profile</p>
                            </div>
                            <button onClick={() => setShowMatchModal(false)} className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="p-4 space-y-3">
                            {matchedSchemes.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">No matches found. Try completing more profile fields.</p>
                                    <button onClick={() => navigate('/schemes')} className="mt-4 px-6 py-2 rounded-full bg-primary text-white text-sm font-semibold">Browse All Schemes</button>
                                </div>
                            ) : matchedSchemes.map(scheme => (
                                <div key={scheme.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="font-bold text-gray-900 text-sm">{scheme.name}</p>
                                    {scheme.benefit_amount && <p className="text-green-700 font-semibold text-sm mt-1">₹ {scheme.benefit_amount}</p>}
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-2 inline-block capitalize">{scheme.category}</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-gray-100">
                            <button onClick={() => { setShowMatchModal(false); navigate('/schemes'); }}
                                className="w-full py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors">
                                See All Schemes →
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
