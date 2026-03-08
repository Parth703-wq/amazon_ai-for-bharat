import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users, MessageSquare, FileCheck, AlertTriangle,
    IndianRupee, RefreshCw, Loader2, CheckCircle
} from 'lucide-react';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

import { adminApi, type AdminStats } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const COLORS = ['#1E3A5F', '#FF9933', '#138808', '#6366f1', '#ec4899'];

const STATUS_COLORS: Record<string, string> = {
    Submitted: 'bg-blue-100 text-blue-700',
    'Under Review': 'bg-yellow-100 text-yellow-700',
    Resolved: 'bg-green-100 text-green-700',
    Closed: 'bg-gray-100 text-gray-700',
};

export const AdminDashboard = () => {
    const { isLoggedIn } = useAuthStore();

    const navigate = useNavigate();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isLoggedIn) { navigate('/auth'); return; }
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await adminApi.getStats();
            setStats(data);
        } catch (e: unknown) {
            setError((e as Error).message || 'Failed to load stats');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
            <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
                <p className="text-gray-500">Loading dashboard...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
            <div className="text-center">
                <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                <p className="text-red-600 mb-4">{error}</p>
                <button onClick={fetchStats} className="text-primary hover:underline text-sm">Retry</button>
            </div>
        </div>
    );

    const kpis = stats?.kpis;

    const kpiCards = [
        { label: 'Total Citizens', value: kpis?.total_citizens?.toLocaleString() ?? '0', icon: <Users className="h-6 w-6" />, color: 'text-blue-600 bg-blue-50' },
        { label: 'AI Conversations', value: kpis?.active_conversations?.toLocaleString() ?? '0', icon: <MessageSquare className="h-6 w-6" />, color: 'text-purple-600 bg-purple-50' },
        { label: 'Schemes Matched', value: kpis?.schemes_matched?.toLocaleString() ?? '0', icon: <FileCheck className="h-6 w-6" />, color: 'text-green-600 bg-green-50' },
        { label: 'Total Grievances', value: kpis?.total_grievances?.toLocaleString() ?? '0', icon: <AlertTriangle className="h-6 w-6" />, color: 'text-orange-600 bg-orange-50' },
        { label: 'Resolved', value: kpis?.resolved_grievances?.toLocaleString() ?? '0', icon: <CheckCircle className="h-6 w-6" />, color: 'text-success bg-success/10' },
        { label: 'Benefits Unlocked', value: `₹${((kpis?.benefits_unlocked_estimate ?? 0) / 100000).toFixed(1)}L`, icon: <IndianRupee className="h-6 w-6" />, color: 'text-amber-600 bg-amber-50' },
    ];

    // Build language data for pie chart
    const langData = stats?.language_distribution?.length
        ? stats.language_distribution
        : [
            { name: 'Hindi', users: 45 },
            { name: 'English', users: 25 },
            { name: 'Bengali', users: 12 },
            { name: 'Tamil', users: 10 },
            { name: 'Others', users: 8 },
        ];

    // Voice vs text for bar chart
    const channelData = [
        { name: 'Voice', value: stats?.voice_text_ratio?.voice ?? 65 },
        { name: 'Text', value: stats?.voice_text_ratio?.text ?? 35 },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-500 mt-1">JanSahayak AI · Real-time platform overview</p>
                    </div>
                    <button
                        onClick={fetchStats}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </button>
                </div>

                {/* AWS Badge */}
                <div className="mb-6 flex flex-wrap gap-2">
                    {['Amazon S3', 'Amazon DynamoDB', 'Amazon Bedrock (Pending)', 'MySQL RDS', 'Gemini AI'].map(s => (
                        <span key={s} className="text-xs px-3 py-1 bg-white border border-gray-200 rounded-full text-gray-600 font-medium shadow-sm">
                            ☁ {s}
                        </span>
                    ))}
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    {kpiCards.map((k, i) => (
                        <motion.div
                            key={k.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${k.color}`}>
                                        {k.icon}
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{k.value}</p>
                                    <p className="text-xs text-gray-500 mt-1">{k.label}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Language Distribution */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Language Distribution</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={langData} dataKey="users" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                                        {langData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Voice vs Text */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Interaction Channels</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={channelData} barSize={60}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(v) => `${v}%`} />
                                    <Bar dataKey="value" fill="#1E3A5F" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Grievances */}
                <Card>
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">Recent Grievances</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {(stats?.recent_grievances?.length ? stats.recent_grievances : []).length === 0 ? (
                            <div className="px-6 py-8 text-center text-gray-400 text-sm">No grievances yet</div>
                        ) : (
                            stats?.recent_grievances?.map((g, i) => (
                                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{g.ticket_id}</span>
                                        <span className="text-sm text-gray-700">{g.category}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[g.status] || 'bg-gray-100 text-gray-600'}`}>
                                            {g.status}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {g.created_at ? new Date(g.created_at).toLocaleDateString('en-IN') : ''}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};
