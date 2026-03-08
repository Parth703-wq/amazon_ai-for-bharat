import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Cloud, Database, Server, Cpu, MessageSquare, FileText,
    Mic, Globe, Users, Zap, Shield, TrendingUp, CheckCircle, ArrowRight
} from 'lucide-react';

// ─── AWS service data ──────────────────────────────────────────────────────────
const AWS_SERVICES = [
    {
        id: 'amplify',
        name: 'AWS Amplify',
        label: 'Frontend Hosting',
        icon: Globe,
        color: '#FF9900',
        bg: '#FFF3E0',
        border: '#FFB74D',
        desc: 'Hosts the React TypeScript frontend with CI/CD. Auto-deploys from Git. Serves the app globally via CloudFront CDN.',
        col: 0, row: 1,
    },
    {
        id: 'apigw',
        name: 'API Gateway',
        label: 'REST API',
        icon: Server,
        color: '#9C27B0',
        bg: '#F3E5F5',
        border: '#CE93D8',
        desc: 'Routes all HTTP requests from Amplify to the Lambda function. Handles authentication, rate limiting, and CORS.',
        col: 1, row: 1,
    },
    {
        id: 'lambda',
        name: 'AWS Lambda',
        label: 'FastAPI Backend',
        icon: Cpu,
        color: '#F44336',
        bg: '#FFEBEE',
        border: '#EF9A9A',
        desc: 'Runs the FastAPI application via Mangum adapter. 512 MB memory, 30-second timeout. Auto-scales to thousands of users.',
        col: 2, row: 1,
    },
    {
        id: 'bedrock',
        name: 'Amazon Bedrock',
        label: 'Claude 3 Sonnet',
        icon: MessageSquare,
        color: '#4CAF50',
        bg: '#E8F5E9',
        border: '#A5D6A7',
        desc: 'Primary AI engine using Claude 3 Sonnet. Powers scheme matching, chat guidance, and document analysis in 10 Indian languages.',
        col: 2, row: 0,
    },
    {
        id: 'dynamodb',
        name: 'Amazon DynamoDB',
        label: 'Chat Sessions',
        icon: Database,
        color: '#2196F3',
        bg: '#E3F2FD',
        border: '#90CAF9',
        desc: 'Stores chat history with 30-day TTL auto-expiry. Provides conversation context to AI for multi-turn dialogues.',
        col: 3, row: 0,
    },
    {
        id: 'rds',
        name: 'Amazon RDS MySQL',
        label: 'Users & Schemes',
        icon: Database,
        color: '#FF5722',
        bg: '#FBE9E7',
        border: '#FFAB91',
        desc: 'Primary relational database storing 34 government schemes, user profiles, applications, and grievances.',
        col: 3, row: 1,
    },
    {
        id: 's3',
        name: 'Amazon S3',
        label: 'Documents',
        icon: FileText,
        color: '#607D8B',
        bg: '#ECEFF1',
        border: '#B0BEC5',
        desc: 'Stores uploaded identity documents (Aadhaar, income certs) with AES256 encryption. Auto-deletes after 24 hours via Lifecycle Policy.',
        col: 3, row: 2,
    },
    {
        id: 'polly',
        name: 'Amazon Polly',
        label: 'Voice Output',
        icon: Mic,
        color: '#009688',
        bg: '#E0F2F1',
        border: '#80CBC4',
        desc: 'Converts AI text responses to MP3 audio in Hindi and 9 other Indian languages — critical for illiterate and elderly users.',
        col: 2, row: 2,
    },
    {
        id: 'textract',
        name: 'Amazon Textract',
        label: 'OCR Analysis',
        icon: FileText,
        color: '#795548',
        bg: '#EFEBE9',
        border: '#BCAAA4',
        desc: 'Extracts text from uploaded government documents (PDFs and images) using machine learning OCR. Feeds data to Bedrock for analysis.',
        col: 1, row: 2,
    },
];

const HOW_USED = [
    { service: 'Amazon Bedrock', icon: MessageSquare, color: '#4CAF50', usage: 'Claude 3 Sonnet matches users to 34 government schemes, analyzes uploaded documents, and answers questions in 10 Indian languages' },
    { service: 'AWS Lambda', icon: Cpu, color: '#F44336', usage: 'Runs the entire FastAPI backend serverlessly — auto-scales to handle thousands of simultaneous rural users without any server management' },
    { service: 'API Gateway', icon: Server, color: '#9C27B0', usage: 'Provides a secure, managed REST API endpoint that connects the React frontend on Amplify to the Lambda backend' },
    { service: 'DynamoDB', icon: Database, color: '#2196F3', usage: 'Stores chat session history with 30-day TTL so Bedrock can maintain conversation context across multiple user interactions' },
    { service: 'Amazon RDS MySQL', icon: Database, color: '#FF5722', usage: 'Primary database holding all 34 government schemes, user profiles, applications, and grievance tickets' },
    { service: 'Amazon S3', icon: FileText, color: '#607D8B', usage: 'Stores uploaded identity documents with AES256 encryption at rest and auto-deletes via Lifecycle Policy after 24 hours' },
    { service: 'Amazon Polly', icon: Mic, color: '#009688', usage: 'Converts AI responses to spoken audio in Hindi and regional languages — making JanSahayak accessible to illiterate users' },
    { service: 'Amazon Textract', icon: FileText, color: '#795548', usage: 'OCR-extracts text from Aadhaar, income certificates, and caste documents so Bedrock can analyze eligibility automatically' },
    { service: 'AWS Amplify', icon: Globe, color: '#FF9900', usage: 'Hosts the React TypeScript frontend with auto CI/CD from Git — serves 10-language UI globally via CloudFront' },
];

const METRICS = [
    { value: '<2s', label: 'AI Response Time', sub: 'Bedrock Claude 3 Sonnet', icon: Zap, color: '#4CAF50' },
    { value: '10', label: 'Languages Supported', sub: 'Hindi, Bengali, Tamil + 7 more', icon: Globe, color: '#2196F3' },
    { value: '34', label: 'Schemes Auto-Matched', sub: 'Central + State schemes', icon: CheckCircle, color: '#FF9900' },
    { value: '500M+', label: 'Indians Can Benefit', sub: 'Rural & semi-urban citizens', icon: Users, color: '#9C27B0' },
];

// ─── Architecture Diagram ──────────────────────────────────────────────────────
const ArchDiagram = () => {
    const [hovered, setHovered] = useState<string | null>(null);
    const selected = hovered ? AWS_SERVICES.find(s => s.id === hovered) : null;

    const connections: [string, string, string][] = [
        ['amplify', 'apigw', 'HTTPS'],
        ['apigw', 'lambda', 'Proxy'],
        ['lambda', 'bedrock', 'AI'],
        ['lambda', 'dynamodb', 'Sessions'],
        ['lambda', 'rds', 'SQL'],
        ['lambda', 's3', 'Files'],
        ['lambda', 'polly', 'TTS'],
        ['lambda', 'textract', 'OCR'],
    ];

    // Node positions (for SVG arrows)
    const positions: Record<string, { x: number; y: number }> = {
        amplify: { x: 100, y: 200 },
        apigw: { x: 260, y: 200 },
        lambda: { x: 440, y: 200 },
        bedrock: { x: 620, y: 80 },
        dynamodb: { x: 800, y: 80 },
        rds: { x: 800, y: 200 },
        s3: { x: 800, y: 320 },
        polly: { x: 620, y: 320 },
        textract: { x: 440, y: 320 },
    };

    // Add user node
    const allPositions = { user: { x: -60, y: 200 }, ...positions };

    return (
        <div className="relative w-full overflow-x-auto">
            {/* User node */}
            <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 shrink-0">
                    <Users className="h-7 w-7" />
                </div>
                <span className="text-sm font-semibold text-gray-500">Indian Citizens<br /><span className="font-normal text-gray-400">500M+ potential users</span></span>
                <ArrowRight className="h-5 w-5 text-gray-300 mx-2" />
            </div>

            {/* Service grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {AWS_SERVICES.map((svc, i) => {
                    const Icon = svc.icon;
                    const isHov = hovered === svc.id;
                    return (
                        <motion.div
                            key={svc.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onMouseEnter={() => setHovered(svc.id)}
                            onMouseLeave={() => setHovered(null)}
                            style={{
                                background: isHov ? svc.color : svc.bg,
                                borderColor: svc.border,
                            }}
                            className={`rounded-2xl border-2 p-4 cursor-pointer transition-all duration-200 ${isHov ? 'shadow-xl scale-105' : 'hover:shadow-md'}`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div
                                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: isHov ? 'rgba(255,255,255,0.25)' : svc.color + '20' }}
                                >
                                    <Icon className="h-5 w-5" style={{ color: isHov ? '#fff' : svc.color }} />
                                </div>
                                <div>
                                    <p className={`text-xs font-bold leading-none ${isHov ? 'text-white' : ''}`} style={{ color: isHov ? '#fff' : svc.color }}>
                                        {svc.name}
                                    </p>
                                    <p className={`text-xs mt-0.5 ${isHov ? 'text-white/80' : 'text-gray-500'}`}>{svc.label}</p>
                                </div>
                            </div>
                            {isHov && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-white/90 text-xs leading-relaxed mt-1"
                                >
                                    {svc.desc}
                                </motion.p>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Connection flow diagram (simplified visual) */}
            <div className="mt-8 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Data Flow</p>
                <div className="flex items-center gap-2 flex-wrap">
                    {[
                        { label: 'User', color: '#6B7280' },
                        { label: '→' },
                        { label: 'Amplify', color: '#FF9900' },
                        { label: '→' },
                        { label: 'API GW', color: '#9C27B0' },
                        { label: '→' },
                        { label: 'Lambda', color: '#F44336' },
                        { label: '→' },
                        { label: 'Bedrock', color: '#4CAF50' },
                        { label: '+' },
                        { label: 'DynamoDB', color: '#2196F3' },
                        { label: '+' },
                        { label: 'RDS', color: '#FF5722' },
                        { label: '+' },
                        { label: 'S3', color: '#607D8B' },
                        { label: '+' },
                        { label: 'Polly', color: '#009688' },
                    ].map((item, i) => (
                        <span key={i}>
                            {item.label === '→' || item.label === '+' ? (
                                <span className="text-gray-400 font-bold">{item.label}</span>
                            ) : (
                                <span
                                    className="text-xs font-bold px-2 py-1 rounded-lg"
                                    style={{ background: item.color + '20', color: item.color }}
                                >
                                    {item.label}
                                </span>
                            )}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export const AwsArchitecturePage = () => {
    return (
        <div className="min-h-screen pt-20 pb-20" style={{ background: 'linear-gradient(135deg, #0F1117 0%, #1A1F2E 50%, #0F1117 100%)' }}>
            <div className="container mx-auto px-4 max-w-7xl">

                {/* ── Hero Header ── */}
                <motion.div
                    className="text-center mb-14"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-2 mb-5">
                        <Cloud className="h-4 w-4 text-orange-400" />
                        <span className="text-orange-400 text-sm font-semibold">AWS Cloud Architecture</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                        JanSahayak AI on AWS
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Production-grade serverless architecture connecting 500 million Indians to 34 government welfare schemes using Amazon Bedrock, Lambda, and 7 AWS services.
                    </p>
                </motion.div>

                {/* ── Metrics ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {METRICS.map((m, i) => {
                        const Icon = m.icon;
                        return (
                            <motion.div
                                key={m.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="rounded-2xl p-5 text-center border"
                                style={{ background: m.color + '12', borderColor: m.color + '30' }}
                            >
                                <Icon className="h-6 w-6 mx-auto mb-2" style={{ color: m.color }} />
                                <p className="text-3xl font-black text-white">{m.value}</p>
                                <p className="text-sm font-semibold mt-1" style={{ color: m.color }}>{m.label}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{m.sub}</p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* ── Architecture Diagram Card ── */}
                <motion.div
                    className="rounded-3xl p-8 mb-10 border border-white/10"
                    style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                            <Cloud className="h-5 w-5 text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Interactive Architecture Diagram</h2>
                            <p className="text-gray-500 text-sm">Hover over any service to see how it's used in JanSahayak</p>
                        </div>
                    </div>
                    <ArchDiagram />
                </motion.div>

                {/* ── Three Info Cards ── */}
                <div className="grid md:grid-cols-3 gap-6 mb-10">

                    {/* Card 1 — Why AI is Required */}
                    <motion.div
                        className="rounded-3xl p-7 border border-green-500/20"
                        style={{ background: 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(76,175,80,0.05) 100%)' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="h-12 w-12 rounded-2xl bg-green-500/20 flex items-center justify-center mb-4">
                            <MessageSquare className="h-6 w-6 text-green-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-3">Why AI is Required</h3>
                        <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
                            <p>
                                <span className="text-green-400 font-semibold">500 million Indians</span> cannot navigate complex government portals that require literacy, internet literacy, and knowledge of bureaucratic language.
                            </p>
                            <p>
                                AI using <span className="text-green-400 font-semibold">Amazon Bedrock</span> translates dense eligibility criteria — like "BPL households with annual income below ₹1.8 lakhs" — into simple regional language explanations a rural farmer can understand.
                            </p>
                            <p>
                                Without AI, matching a user to the right scheme across <span className="text-green-400 font-semibold">34 schemes in 10 languages</span> would require manual search by a government officer — taking days instead of seconds.
                            </p>
                        </div>
                    </motion.div>

                    {/* Card 2 — How AWS Services Are Used */}
                    <motion.div
                        className="rounded-3xl p-7 border border-blue-500/20"
                        style={{ background: 'linear-gradient(135deg, rgba(33,150,243,0.1) 0%, rgba(33,150,243,0.05) 100%)' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4">
                            <Shield className="h-6 w-6 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-3">How AWS Services Are Used</h3>
                        <div className="space-y-2">
                            {HOW_USED.slice(0, 6).map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.service} className="flex items-start gap-2.5">
                                        <Icon className="h-3.5 w-3.5 shrink-0 mt-1" style={{ color: item.color }} />
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            <span className="font-semibold" style={{ color: item.color }}>{item.service}:</span>{' '}
                                            {item.usage}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Card 3 — Value AI Adds */}
                    <motion.div
                        className="rounded-3xl p-7 border border-orange-500/20"
                        style={{ background: 'linear-gradient(135deg, rgba(255,153,0,0.1) 0%, rgba(255,153,0,0.05) 100%)' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="h-12 w-12 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-4">
                            <TrendingUp className="h-6 w-6 text-orange-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-3">Value AI Adds</h3>
                        <div className="space-y-4 mb-5">
                            {[
                                { val: '<2s', label: 'Response time', sub: 'vs hours with manual search', color: '#4CAF50' },
                                { val: '10', label: 'Languages supported', sub: 'Hindi, Bengali, Tamil, Telugu, + 6 more', color: '#2196F3' },
                                { val: '34', label: 'Schemes matched automatically', sub: 'Central + state welfare programs', color: '#FF9900' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: item.color + '12' }}>
                                    <p className="text-2xl font-black" style={{ color: item.color }}>{item.val}</p>
                                    <div>
                                        <p className="text-sm font-semibold text-white leading-none">{item.label}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            JanSahayak AI ensures that <span className="text-orange-400 font-semibold">no eligible Indian misses a welfare benefit</span> due to lack of information or language barriers.
                        </p>
                    </motion.div>
                </div>

                {/* ── Full service list ── */}
                <motion.div
                    className="rounded-3xl p-7 border border-white/10"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    <h3 className="text-lg font-bold text-white mb-5">Complete AWS Service Usage</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        {HOW_USED.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.service} className="flex items-start gap-3 p-4 rounded-2xl border" style={{ borderColor: item.color + '30', background: item.color + '08' }}>
                                    <div className="h-9 w-9 rounded-xl shrink-0 flex items-center justify-center" style={{ background: item.color + '20' }}>
                                        <Icon className="h-4 w-4" style={{ color: item.color }} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold mb-1" style={{ color: item.color }}>{item.service}</p>
                                        <p className="text-xs text-gray-400 leading-relaxed">{item.usage}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

            </div>
        </div>
    );
};
