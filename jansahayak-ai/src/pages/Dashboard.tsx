import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Search, MapPin, FileText, AlertTriangle, MessageCircle,
    ChevronRight, User, CheckCircle, Bell, TrendingUp, Landmark,
    Sparkles, IndianRupee, Shield
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { schemesApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';

const QUICK_ACTIONS = [
    { label: 'Find Schemes', desc: 'Match schemes to your profile', icon: Search, path: '/schemes', color: 'bg-blue-50 text-blue-600' },
    { label: 'AI Chat', desc: 'Ask anything in your language', icon: MessageCircle, path: '/chat', color: 'bg-purple-50 text-purple-600' },
    { label: 'Document Reader', desc: 'Upload & AI-analyze your docs', icon: FileText, path: '/documents', color: 'bg-green-50 text-green-600' },
    { label: 'Office Locator', desc: 'Find nearest Jan Seva Kendra', icon: MapPin, path: '/offices', color: 'bg-amber-50 text-amber-600' },
    { label: 'Grievance', desc: 'File or track a complaint', icon: AlertTriangle, path: '/grievance', color: 'bg-red-50 text-red-600' },
    { label: 'My Profile', desc: 'Complete your profile for better matches', icon: User, path: '/profile', color: 'bg-gray-50 text-gray-600' },
];

export const Dashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [schemeCount, setSchemeCount] = useState<number | null>(null);
    const [recentSchemes, setRecentSchemes] = useState<{ name: string; benefit_amount?: string; category: string }[]>([]);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    const userDash = user as unknown as Record<string, unknown>;
    const completionPct = [user?.state, user?.annual_income, userDash?.caste_category, user?.district]
        .filter(Boolean).length * 25;

    type ProfileStep = { key: string; label: string; hint: string; icon: React.ElementType };
    const PROFILE_STEPS: ProfileStep[] = [
        { key: 'state', label: 'Add your State', hint: 'Unlock state schemes', icon: MapPin },
        { key: 'annual_income', label: 'Add Annual Income', hint: '+8 income-based schemes', icon: IndianRupee },
        { key: 'caste_category', label: 'Add Caste Category', hint: '+5 reserved category schemes', icon: Shield },
        { key: 'district', label: 'Add District', hint: 'Find nearest offices', icon: MapPin },
    ];
    const missingSteps = PROFILE_STEPS.filter(s => !userDash?.[s.key]);

    useEffect(() => {
        schemesApi.getSchemes({ limit: 3 }).then(res => {
            setSchemeCount(res.total || res.schemes?.length || 34);
            setRecentSchemes(res.schemes?.slice(0, 3) || []);
        }).catch(() => {
            setSchemeCount(34);
        });
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="container mx-auto px-4 max-w-5xl">

                {/* Welcome Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-primary rounded-2xl p-6 mb-8 text-white flex items-center justify-between"
                >
                    <div>
                        <p className="text-white/70 text-sm font-medium">{greeting}</p>
                        <h1 className="text-2xl font-bold mt-0.5">{user?.full_name?.split(' ')[0]} — Namaste!</h1>
                        <p className="text-white/80 text-sm mt-1">
                            {user?.state ? `Showing schemes available in ${user.state}` : 'Complete your profile to get personalized scheme matches'}
                        </p>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-3xl shrink-0">
                        जन
                    </div>
                </motion.div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Schemes Available', value: schemeCount ?? '...', icon: Landmark, color: 'text-blue-600' },
                        { label: 'Languages Supported', value: '10', icon: TrendingUp, color: 'text-green-600' },
                        { label: 'Profile Complete', value: `${completionPct}%`, icon: CheckCircle, color: completionPct === 100 ? 'text-green-600' : 'text-amber-600' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card>
                                <CardContent className="p-4 flex flex-col gap-1">
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    <p className="text-xs text-gray-500">{stat.label}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <div className="lg:col-span-2">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {QUICK_ACTIONS.map((action, i) => (
                                <motion.button
                                    key={action.path}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => navigate(action.path)}
                                    className="bg-white rounded-2xl p-4 text-left hover:shadow-md transition-all border border-gray-100 hover:border-primary/30 group"
                                >
                                    <div className={`h-10 w-10 rounded-xl ${action.color} flex items-center justify-center mb-3`}>
                                        <action.icon className="h-5 w-5" />
                                    </div>
                                    <p className="font-semibold text-gray-900 text-sm">{action.label}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 leading-tight">{action.desc}</p>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Recent Schemes */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Top Schemes</h2>
                            <button onClick={() => navigate('/schemes')} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
                                View all <ChevronRight className="h-3 w-3" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {recentSchemes.length > 0 ? recentSchemes.map((scheme, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={() => navigate('/schemes')}
                                    className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md cursor-pointer hover:border-primary/30 transition-all"
                                >
                                    <p className="font-semibold text-gray-900 text-sm leading-tight">{scheme.name}</p>
                                    {scheme.benefit_amount && (
                                        <p className="text-primary font-bold text-sm mt-1">{scheme.benefit_amount}</p>
                                    )}
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-2 inline-block capitalize">{scheme.category}</span>
                                </motion.div>
                            )) : [1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
                                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                                </div>
                            ))}
                        </div>

                        {/* Profile Completion Steps (when <80%) */}
                        {completionPct < 80 && missingSteps.length > 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                                className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-2">
                                    <Bell className="h-3.5 w-3.5" /> Complete profile to unlock more schemes
                                </p>
                                <div className="space-y-1.5">
                                    {missingSteps.slice(0, 2).map((step) => (
                                        <button key={step.key} onClick={() => navigate('/profile')}
                                            className="w-full flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-amber-100 hover:border-primary/30 text-left transition-all group">
                                            <step.icon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-gray-800 group-hover:text-primary truncate">{step.label}</p>
                                                <p className="text-[10px] text-gray-400">{step.hint}</p>
                                            </div>
                                            <ChevronRight className="h-3 w-3 text-gray-300 shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Eligible schemes banner */}
                        {completionPct >= 50 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                                className="mt-4 bg-primary/5 border border-primary/20 rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-colors"
                                onClick={() => navigate('/profile')}>
                                <div className="flex items-start gap-2">
                                    <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                    <p className="text-xs font-semibold text-gray-900">
                                        Based on your profile, you may be eligible for <span className="text-primary">{schemeCount ?? '...'} schemes</span>
                                    </p>
                                </div>
                                <p className="text-xs text-primary font-bold mt-2 ml-6 flex items-center gap-1">
                                    Find My Eligible Schemes <ChevronRight className="h-3 w-3" />
                                </p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

