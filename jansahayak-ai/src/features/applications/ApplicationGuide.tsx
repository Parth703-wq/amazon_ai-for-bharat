import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, FileText, Users, Download, Info, CheckCircle, Circle, Volume2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Step {
    id: number;
    title: string;
    description: string;
    icon: React.ReactNode;
    time: string;
}

const STEPS: Step[] = [
    { id: 1, title: 'Gather Documents', description: 'Collect your Aadhaar Card, Bank Passbook, and land records (Khatauni).', icon: <FileText className="h-6 w-6 text-primary" />, time: '10 mins' },
    { id: 2, title: 'Find Service Center', description: 'Visit your nearest Common Service Centre (CSC) or Gram Panchayat office.', icon: <MapPin className="h-6 w-6 text-primary" />, time: 'Locate on Map' },
    { id: 3, title: 'Verify Identity', description: 'The operator will authenticate your identity using Aadhaar biometrics.', icon: <Users className="h-6 w-6 text-primary" />, time: '5 mins' },
];

export const ApplicationGuide = () => {
    const navigate = useNavigate();
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    const toggleStep = (id: number) => {
        setCompletedSteps(prev =>
            prev.includes(id) ? prev.filter(stepId => stepId !== id) : [...prev, id]
        );
    };

    const isCompleted = (id: number) => completedSteps.includes(id);

    return (
        <section className="bg-white py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 leading-tight">PM Kisan Application Guide</h2>
                        <p className="mt-2 text-gray-600">Follow these simple steps to apply for the scheme. You can save this guide offline.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="shrink-0"><Volume2 className="mr-2 h-4 w-4" /> Listen to Guide</Button>
                        <Button variant="outline" className="shrink-0"><Download className="mr-2 h-4 w-4" /> Save Offline</Button>
                    </div>
                </div>

                {/* Progress Tracker */}
                <div className="mb-12 relative flex justify-between items-center text-sm font-medium">
                    <div className="absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 bg-gray-200 rounded-full z-0" />
                    <motion.div
                        className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-success rounded-full z-0 transition-all duration-500 ease-in-out"
                        style={{ width: `${(completedSteps.length / STEPS.length) * 100}%` }}
                    />
                    {STEPS.map((step) => (
                        <div
                            key={step.id}
                            className={cn(
                                "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white font-bold transition-colors duration-300",
                                isCompleted(step.id) ? "bg-success text-white" : "bg-gray-200 text-gray-500"
                            )}
                        >
                            {isCompleted(step.id) ? <CheckCircle className="h-5 w-5" /> : step.id}
                        </div>
                    ))}
                </div>

                {/* Steps List */}
                <div className="space-y-6">
                    {STEPS.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.15 }}
                        >
                            <Card className={cn(
                                "transition-all duration-300 relative overflow-hidden",
                                isCompleted(step.id) ? "ring-2 ring-success bg-success/5 border-transparent" : "hover:border-primary/30"
                            )}>
                                <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                                        {step.icon}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm font-bold tracking-wider text-gray-500 uppercase">Step {step.id}</span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className="text-sm font-medium text-gray-500">{step.time}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                                        <p className="text-gray-600 text-lg leading-relaxed mb-4">{step.description}</p>

                                        <button className="text-primary font-medium flex items-center gap-1 hover:underline text-sm">
                                            <Info className="h-4 w-4" /> What does Khatauni mean?
                                        </button>
                                    </div>

                                    <div className="sm:ml-auto shrink-0 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-gray-200 flex justify-center sm:justify-end">
                                        <Button
                                            size="lg"
                                            variant={isCompleted(step.id) ? "ghost" : "outline"}
                                            onClick={() => toggleStep(step.id)}
                                            className={cn(
                                                "w-full sm:w-auto",
                                                isCompleted(step.id) && "text-success hover:bg-success hover:text-white"
                                            )}
                                        >
                                            {isCompleted(step.id) ? (
                                                <><CheckCircle className="mr-2 h-5 w-5" /> Completed</>
                                            ) : (
                                                <><Circle className="mr-2 h-5 w-5 opacity-40" /> Mark Complete</>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Action Button When Done */}
                <AnimatePresence>
                    {completedSteps.length === STEPS.length && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-12 flex justify-center"
                        >
                            <Button size="lg" className="h-16 px-12 text-xl rounded-full shadow-xl shadow-success/20 bg-success hover:bg-success/90" onClick={() => navigate('/profile')}>
                                Proceed to Apply <ArrowRight className="ml-3 h-6 w-6" />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </section>
    );
};
