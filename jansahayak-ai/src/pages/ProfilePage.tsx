import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, MapPin, IndianRupee, Edit3, Save, CheckCircle, LogOut, Shield, Loader2, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const STATES = [
    'Andhra Pradesh', 'Bihar', 'Chhattisgarh', 'Delhi', 'Gujarat', 'Haryana', 'Himachal Pradesh',
    'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab',
    'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const CASTE_CATS = ['General', 'OBC', 'SC', 'ST', 'EWS'];

export const ProfilePage = () => {
    const { user, isLoggedIn, logout, refreshUser, updateUser } = useAuthStore();
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState<Record<string, any>>({});

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
                caste_category: (user as any).caste_category || '',
                preferred_language: user.preferred_language || 'en',
            });
        }
    }, [user]);

    const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

    const save = async () => {
        setSaving(true);
        try {
            await authApi.updateProfile(form);
            updateUser(form as any);
            setEditing(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    const completionPct = [user.state, user.annual_income, (user as any).caste_category, user.district]
        .filter(Boolean).length * 25;

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

                        {/* Profile completion */}
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
                    </Card>
                </motion.div>

                {/* Profile Details */}
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
                                        <select className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:border-primary outline-none" value={form.state} onChange={e => set('state', e.target.value)}>
                                            <option value="">Select state</option>
                                            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    ) : field.type === 'caste' ? (
                                        <select className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:border-primary outline-none" value={form.caste_category} onChange={e => set('caste_category', e.target.value)}>
                                            <option value="">Select category</option>
                                            {CASTE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    ) : (
                                        <input className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-primary outline-none" type={field.type} value={form[field.key] || ''} onChange={e => set(field.key, e.target.value)} />
                                    )
                                ) : (
                                    <p className="text-gray-900 font-medium">{(user as any)[field.key] || <span className="text-gray-400 italic">Not set</span>}</p>
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
                        { label: 'Find My Schemes', path: '/schemes', color: 'bg-primary text-white' },
                        { label: 'My Grievances', path: '/grievance', color: 'bg-accent/20 text-accent-dark' },
                        { label: 'My Documents', path: '/documents', color: 'bg-success/10 text-success-dark' },
                        { label: 'AI Assistant', path: '/chat', color: 'bg-purple-50 text-purple-700' },
                    ].map(a => (
                        <button key={a.path} onClick={() => navigate(a.path)} className={`rounded-2xl p-4 text-left font-semibold text-sm hover:opacity-90 transition-opacity ${a.color}`}>
                            {a.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
