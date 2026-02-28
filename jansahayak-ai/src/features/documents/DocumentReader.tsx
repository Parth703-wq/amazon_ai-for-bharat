import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertCircle, CheckCircle, Calendar, Volume2, ZoomIn, ZoomOut, Maximize, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const DocumentReader = () => {
    const [analyzing, setAnalyzing] = useState(false);
    const [zoom, setZoom] = useState(1);

    // Simulate analysis state
    const handleAnalyze = () => {
        setAnalyzing(true);
        setTimeout(() => setAnalyzing(false), 2000);
    };

    return (
        <section className="bg-gray-50 py-12">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 leading-tight flex items-center gap-3">
                        AI Document Reader <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">Beta</span>
                    </h2>
                    <p className="mt-2 text-gray-600">We automatically read your documents and explain them simply.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[700px]">
                    {/* Left Pane: Document Image */}
                    <Card className="flex flex-col overflow-hidden border-2 bg-gray-100">
                        <div className="flex bg-white items-center justify-between p-3 border-b border-gray-200 shadow-sm z-10">
                            <span className="font-semibold text-sm text-gray-700">IncomeCertificate_RamSingh.pdf</span>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}><ZoomOut className="h-4 w-4" /></Button>
                                <span className="text-sm text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded">{Math.round(zoom * 100)}%</span>
                                <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.2))}><ZoomIn className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm"><Maximize className="h-4 w-4" /></Button>
                            </div>
                        </div>

                        <div className="flex-1 relative overflow-auto p-8 flex items-center justify-center bg-gray-200">
                            {/* Dummy Document Representation */}
                            <motion.div
                                style={{ scale: zoom }}
                                className="bg-white w-[400px] h-[580px] origin-top shadow-xl relative p-8 border border-gray-300"
                            >
                                <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
                                    <h3 className="font-serif font-bold text-xl uppercase tracking-widest text-slate-800">Uttar Pradesh Government</h3>
                                    <h4 className="font-serif font-semibold text-lg text-slate-700 mt-2">Income Certificate</h4>
                                </div>

                                <div className="space-y-4 font-serif text-sm">
                                    <div className="flex justify-between">
                                        <span>Certificate No: <span className="font-semibold bg-accent/20 px-1">UP-2023-9843</span></span>
                                        <span>Date: <span className="font-semibold bg-accent/20 px-1">12/08/2023</span></span>
                                    </div>
                                    <p className="leading-loose mt-8">
                                        This is to certify that Shri <span className="font-bold border-b border-black bg-accent/20 px-1">Ram Singh</span> son of Shri Hari Singh, resident of Village Rampur, Tehsil Sadar, District Lucknow, has an annual family income of <span className="font-bold border-b border-black bg-green-200 px-1">₹45,000</span> (Rupees Forty Five Thousand only) from all sources.
                                    </p>
                                    <p className="leading-loose mt-4">
                                        This certificate is valid for a period of <span className="font-semibold">3 years</span> from the date of issue.
                                    </p>
                                </div>

                                {/* Simulated Redaction Box for PII */}
                                <div className="absolute bottom-16 left-8 right-8 flex justify-between items-end">
                                    <div className="w-24 h-24 border-2 border-blue-800 rounded-full flex items-center justify-center text-blue-800 font-bold opacity-30 transform -rotate-12">
                                        SEAL
                                    </div>
                                    <div className="text-right">
                                        <div className="w-32 h-8 bg-black/80 flex items-center justify-center text-white text-xs font-bold mb-2">
                                            REDACTED (Aadhaar)
                                        </div>
                                        <span className="font-serif text-xs">Issuing Authority</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </Card>

                    {/* Right Pane: AI Explanation */}
                    <Card className="flex flex-col overflow-hidden bg-white shadow-lg relative border-0 ring-1 ring-gray-200">
                        {analyzing ? (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900">AI is reading your document...</h3>
                                <p className="text-gray-500">Checking validity and extracting key details</p>
                            </div>
                        ) : (
                            <>
                                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center z-10">
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold tracking-wide uppercase">Income Certificate</span>
                                        <div className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-200/60 px-2 py-1 rounded">
                                            <Shield className="h-3 w-3 text-success" /> PII Protected
                                        </div>
                                    </div>

                                    <Button onClick={handleAnalyze} variant="outline" size="sm" className="hidden lg:flex">Re-Analyze</Button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {/* Analysis Summary */}
                                    <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
                                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-success" /> Document Verified
                                        </h4>
                                        <p className="text-gray-700 leading-relaxed">
                                            This is a valid official Income Certificate for Ram Singh showing an annual income of ₹45,000. It makes you eligible for 12 additional schemes including PM Awas Yojana.
                                        </p>
                                    </div>

                                    {/* Key Information Callouts */}
                                    <h5 className="font-bold text-gray-400 uppercase tracking-wider text-xs mb-[-8px] mt-8">Extracted Key Data</h5>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="border border-gray-100 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <span className="text-xs font-semibold text-gray-500 uppercase">Applicant Name</span>
                                            <p className="text-lg font-bold text-gray-900 mt-1">Ram Singh</p>
                                        </div>
                                        <div className="border border-green-100 bg-green-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <span className="text-xs font-semibold text-green-700 uppercase">Annual Income</span>
                                            <p className="text-lg font-extrabold text-green-900 mt-1">₹45,000</p>
                                        </div>
                                        <div className="border border-gray-100 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <span className="text-xs font-semibold text-gray-500 uppercase">Certificate No.</span>
                                            <p className="text-sm font-bold text-gray-900 mt-1">UP-2023-9843</p>
                                            <button className="text-xs text-primary font-medium hover:underline mt-2">Verify online</button>
                                        </div>
                                        <div className="border border-gray-100 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <span className="text-xs font-semibold text-gray-500 uppercase">Village/Tehsil</span>
                                            <p className="text-sm font-bold text-gray-900 mt-1">Rampur, Sadar</p>
                                        </div>
                                    </div>

                                    {/* Important Dates */}
                                    <h5 className="font-bold text-gray-400 uppercase tracking-wider text-xs mb-[-8px] mt-8">Important Dates</h5>
                                    <div className="bg-white border text-gray-800 border-gray-100 rounded-lg p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-accent/10 p-2 rounded-full"><Calendar className="h-5 w-5 text-accent" /></div>
                                            <div>
                                                <p className="font-semibold text-sm">Issue Date: 12 Aug 2023</p>
                                                <p className="text-xs text-gray-500 mt-1">Valid until 11 Aug 2026</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* FAB Audio Player */}
                                <div className="absolute bottom-6 right-6">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex items-center gap-2 bg-primary text-white px-6 py-4 rounded-full shadow-2xl hover:bg-primary/90 font-medium"
                                    >
                                        <Volume2 className="h-5 w-5" />
                                        Read Aloud in हिन्दी
                                    </motion.button>
                                </div>
                            </>
                        )}
                    </Card>
                </div>
            </div>
        </section>
    );
};
