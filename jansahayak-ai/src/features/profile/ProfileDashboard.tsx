import React from 'react';
import {
    User, Edit3, Users, MapPin, TrendingUp, Paperclip,
    Clock, Lock, Download, ShieldCheck, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ProfileDashboard = () => {
    return (
        <section className="bg-gray-50 py-12" id="profile">
            <div className="container mx-auto px-4 max-w-5xl">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 leading-tight">My Profile Memory</h2>
                        <p className="mt-2 text-gray-600 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-success" /> End-to-end Encrypted Digital Vault
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                        <Button variant="ghost" size="sm" className="text-gray-600">
                            <Download className="mr-2 h-4 w-4" /> Download Data (DPDP)
                        </Button>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Personal Info */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                                <User className="h-5 w-5 text-primary" /> Personal Info
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full"><Edit3 className="h-4 w-4" /></Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">Name</span>
                                <p className="font-medium text-gray-900">Ramesh Kumar</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">Aadhaar</span>
                                <p className="font-mono text-gray-900 flex items-center gap-2">
                                    XXXX-XXXX-8492 <CheckCircle className="h-3 w-3 text-success" />
                                </p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">Phone</span>
                                <p className="font-medium text-gray-900">+91 98765 43210</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Family Composition */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                                <Users className="h-5 w-5 text-indigo-600" /> Family Detail
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full"><Edit3 className="h-4 w-4" /></Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100">
                                    <span className="font-medium text-sm">Sunita Devi</span>
                                    <span className="text-xs text-gray-500">Wife • 42 yrs</span>
                                </div>
                                <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100">
                                    <span className="font-medium text-sm">Arjun Kumar</span>
                                    <span className="text-xs text-gray-500">Son • 18 yrs</span>
                                </div>
                                <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100">
                                    <span className="font-medium text-sm">Priya Kumari</span>
                                    <span className="text-xs text-gray-500">Daughter • 14 yrs</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Income Details */}
                    <Card className="hover:shadow-md transition-shadow bg-green-50/30 border-green-100">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                                <TrendingUp className="h-5 w-5 text-green-600" /> Income Range
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-green-700 hover:bg-green-100"><Edit3 className="h-4 w-4" /></Button>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-900 mb-2">₹45,000<span className="text-sm font-medium text-gray-500 ml-1">/year</span></div>
                            <p className="text-sm text-gray-600 mb-4">Verified via Income Certificate UP-2023-9843</p>

                            <div className="h-2 w-full bg-green-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-1/4 rounded-full" />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
                                <span>BPL Limit</span>
                                <span>Middle Income</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Land & Assets */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                                <MapPin className="h-5 w-5 text-orange-600" /> Land Holdings
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full"><Edit3 className="h-4 w-4" /></Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">Total Agricultural Land</span>
                                <p className="font-bold text-xl text-gray-900">2.5 Hectares</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <p className="text-sm font-medium text-gray-700 mb-1">Plot 45-B, Rampur Village</p>
                                <span className="text-xs bg-accent/10 text-accent font-semibold px-2 py-0.5 rounded">Verified via Bhulekh</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Linked Documents */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                                <Paperclip className="h-5 w-5 text-blue-600" /> Linked Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-3 rounded-lg mb-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-blue-600" />
                                    <span className="font-semibold text-blue-900 text-sm">DigiLocker Synced</span>
                                </div>
                                <Button variant="outline" size="sm" className="h-8 bg-white border-blue-200 text-blue-700 hover:bg-blue-100">Sync Now</Button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                                    <div className="p-2 bg-gray-100 rounded text-gray-500"><Lock className="h-4 w-4" /></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Aadhaar Card</p>
                                        <p className="text-xs text-gray-500">Added 2 months ago</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                                    <div className="p-2 bg-gray-100 rounded text-gray-500"><Lock className="h-4 w-4" /></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Income Certificate</p>
                                        <p className="text-xs text-gray-500">Added yesterday</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Scheme History */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                                <Clock className="h-5 w-5 text-gray-600" /> Scheme History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative pl-6 border-l-2 border-gray-200 space-y-6 pb-2">
                                <div className="relative">
                                    <div className="absolute -left-[31px] bg-white p-1 rounded-full"><div className="w-3 h-3 bg-success rounded-full" /></div>
                                    <p className="text-sm font-bold text-gray-900">PM Kisan Samman Nidhi</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><CheckCircle className="h-3 w-3 text-success" /> Active • Receiving Benefits</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-[31px] bg-white p-1 rounded-full"><div className="w-3 h-3 bg-accent rounded-full animate-pulse" /></div>
                                    <p className="text-sm font-bold text-gray-900">Ayushman Bharat</p>
                                    <p className="text-xs text-accent font-medium mt-1">Application under review (7 days left)</p>
                                </div>
                            </div>

                            <Button variant="ghost" className="w-full mt-4 text-primary hover:bg-primary/5">View Full Timeline</Button>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </section>
    );
};
