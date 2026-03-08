import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, User, MapPin, Eye, EyeOff } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

const STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal', 'Delhi'
];

export const AuthPage = () => {
    const navigate = useNavigate();
    const { login, register } = useAuthStore();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPwd, setShowPwd] = useState(false);

    const [form, setForm] = useState({
        full_name: '', phone: '', password: '', state: ''
    });

    const set = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (mode === 'login') {
                await login(form.phone, form.password);
            } else {
                await register({ full_name: form.full_name, phone: form.phone, password: form.password, state: form.state });
            }
            navigate('/');
        } catch (err: unknown) {
            setError((err as Error).message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-accent/5 px-4 pt-20">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Card */}
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-primary px-8 py-10 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white font-bold text-3xl mx-auto mb-4">
                            जन
                        </div>
                        <h1 className="text-2xl font-bold text-white">JanSahayak AI</h1>
                        <p className="text-white/70 text-sm mt-1">Your gateway to government welfare schemes</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100">
                        {(['login', 'register'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => { setMode(tab); setError(''); }}
                                className={`flex-1 py-4 font-semibold text-sm capitalize transition-colors ${mode === tab ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab === 'login' ? 'Sign In' : 'Create Account'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-5">
                        <AnimatePresence mode="wait">
                            {mode === 'register' && (
                                <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                                            placeholder="Ramesh Kumar"
                                            value={form.full_name}
                                            onChange={e => set('full_name', e.target.value)}
                                            required
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                                    placeholder="9876543210"
                                    type="tel"
                                    maxLength={10}
                                    value={form.phone}
                                    onChange={e => set('phone', e.target.value.replace(/\D/g, ''))}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                                    placeholder="••••••••"
                                    type={showPwd ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => set('password', e.target.value)}
                                    required
                                    minLength={6}
                                />
                                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {mode === 'register' && (
                                <motion.div key="state" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <select
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition appearance-none bg-white"
                                            value={form.state}
                                            onChange={e => set('state', e.target.value)}
                                        >
                                            <option value="">Select your state</option>
                                            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                                {error}
                            </div>
                        )}

                        <Button type="submit" size="lg" className="w-full" isLoading={loading}>
                            {mode === 'login' ? 'Sign In' : 'Create Account'}
                        </Button>


                    </form>
                </div>


            </motion.div>
        </div>
    );
};
