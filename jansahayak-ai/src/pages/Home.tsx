import React from 'react';
import { Hero } from '@/features/home/Hero';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, FileText, AlertTriangle, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const Home = () => {
    const navigate = useNavigate();

    const features = [
        { title: 'Find Schemes', description: 'Discover welfare matching your profile', icon: <Search className="h-6 w-6 text-primary" />, path: '/schemes' },
        { title: 'Application Guide', description: 'Step-by-step help to apply', icon: <FileText className="h-6 w-6 text-primary" />, path: '/guide' },
        { title: 'Document Reader', description: 'AI extracts details from your docs', icon: <FileText className="h-6 w-6 text-primary" />, path: '/documents' },
        { title: 'Office Locator', description: 'Find nearby Jan Seva Kendras', icon: <MapPin className="h-6 w-6 text-primary" />, path: '/locator' },
        { title: 'Grievance', description: 'Report an issue or complaint', icon: <AlertTriangle className="h-6 w-6 text-primary" />, path: '/grievance' },
        { title: 'Profile Vault', description: 'Your secure digital document vault', icon: <User className="h-6 w-6 text-primary" />, path: '/profile' }
    ];

    return (
        <div className="flex flex-col w-full min-h-screen">
            <Hero />

            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Explore Platform Features</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {features.map((feat) => (
                            <Card
                                key={feat.path}
                                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                                onClick={() => navigate(feat.path)}
                            >
                                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                                    <div className="p-4 bg-primary/10 rounded-full">
                                        {feat.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">{feat.title}</h3>
                                        <p className="text-gray-600 mt-1">{feat.description}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="mt-auto bg-gray-900 text-gray-400 py-8 text-center border-t border-gray-800">
                <p>© 2026 JanSahayak AI. Digital Public Infrastructure for India.</p>
                <div className="flex justify-center gap-4 mt-4 font-medium text-sm">
                    <button onClick={() => navigate('/admin')} className="hover:text-white transition-colors">Admin Portal</button>
                    <a href="#privacy" className="hover:text-white transition-colors">DPDP Privacy</a>
                </div>
            </footer>
        </div>
    );
};
