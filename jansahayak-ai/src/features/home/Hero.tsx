import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mic, Keyboard, Database, Globe, Signal, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Hero = () => {
    const navigate = useNavigate();
    return (
        <section className="relative w-full overflow-hidden bg-white pb-20 pt-16 lg:pt-24 border-b border-gray-100">
            {/* Animated Gradient Mesh Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 -left-40 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[100px]" />
                <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-accent/10 blur-[100px]" />
            </div>

            <div className="container relative z-10 mx-auto px-4">
                <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
                    {/* Left Column: Copy & Actions */}
                    <div className="max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-gray-900 lg:text-6xl">
                                Find every government scheme you're eligible for —{' '}
                                <span className="text-primary">by simply speaking.</span>
                            </h1>
                            <p className="mb-8 text-xl text-gray-600 leading-relaxed font-medium">
                                No typing, no complex forms, no reading required. Just talk to JanSahayak in
                                your own language, and we'll instantly match you with welfare benefits you deserve.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
                                <Button size="lg" className="w-full sm:w-auto min-w-[200px] rounded-full text-lg shadow-lg" onClick={() => navigate('/schemes')}>
                                    <Mic className="mr-2 h-6 w-6" /> Start Voice Chat
                                </Button>
                                <Button size="lg" variant="outline" className="w-full sm:w-auto min-w-[200px] rounded-full text-lg shadow-sm border-2" onClick={() => navigate('/schemes')}>
                                    <Keyboard className="mr-2 h-5 w-5" /> Type Your Question
                                </Button>
                            </div>

                            {/* Trust Indicators */}
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-6 border-t border-gray-100">
                                <div className="flex flex-col gap-2">
                                    <Database className="h-6 w-6 text-primary" />
                                    <span className="text-sm font-semibold text-gray-900">937+ Schemes Mapped</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Globe className="h-6 w-6 text-primary" />
                                    <span className="text-sm font-semibold text-gray-900">22 Languages</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Signal className="h-6 w-6 text-primary" />
                                    <span className="text-sm font-semibold text-gray-900">2G Compatible</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <ShieldCheck className="h-6 w-6 text-primary" />
                                    <span className="text-sm font-semibold text-gray-900">Bank-Grade Security</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Interactive Demo Visualization */}
                    <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="relative rounded-2xl border flex flex-col items-center justify-center p-8 bg-white/70 backdrop-blur-xl border-white/20 shadow-2xl overflow-hidden h-[500px]"
                        >
                            {/* Voice waveform animation placeholder */}
                            <div className="relative flex h-32 w-32 items-center justify-center mb-8">
                                <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping duration-[1200ms]" />
                                <div className="absolute inset-2 rounded-full bg-accent/40 animate-pulse duration-[1200ms]" />
                                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-accent shadow-lg">
                                    <Mic className="h-8 w-8 text-white" />
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 w-full relative z-10 translate-y-4">
                                <div className="h-2 w-12 bg-gray-200 rounded-full mb-3" />
                                <div className="h-4 w-3/4 bg-gray-200 rounded-full mb-2" />
                                <div className="h-4 w-1/2 bg-gray-200 rounded-full" />
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 w-full relative z-0 translate-y-0 opacity-80 scale-95 origin-bottom">
                                <div className="h-2 w-12 bg-gray-200 rounded-full mb-3" />
                                <div className="h-4 w-2/3 bg-gray-200 rounded-full mb-2" />
                                <div className="h-4 w-1/3 bg-gray-200 rounded-full" />
                            </div>

                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};
