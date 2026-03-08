import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, Menu, X, User, LogOut, Globe, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const LANGUAGES = ['English', 'हिंदी', 'বাংলা', 'தமிழ்', 'తెలుగు', 'मराठी', 'ਪੰਜਾਬੀ', ' gujarati'];

const NAV_LINKS = [
    { label: 'Find Schemes', path: '/schemes' },
    { label: 'AI Chat', path: '/chat' },
    { label: 'Documents', path: '/documents' },
    { label: 'Offices', path: '/offices' },
    { label: 'Grievance', path: '/grievance' },
];

// Public links (visible to everyone including logged out users)
const PUBLIC_NAV_LINKS = [
    { label: '☁️ AWS Architecture', path: '/architecture' },
];

export const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoggedIn, user, logout } = useAuthStore();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    const handleLogout = () => { logout(); navigate('/'); };

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-white border-b border-gray-100'
            }`}>
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg">जन</div>
                        <div>
                            <span className="text-lg font-bold text-primary">JanSahayak</span>
                            <span className="text-xs bg-accent/20 text-amber-700 px-1.5 py-0.5 rounded-full ml-1.5 font-semibold">AI</span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {isLoggedIn && NAV_LINKS.map(link => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === link.path
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {/* AWS Architecture — always visible */}
                        {PUBLIC_NAV_LINKS.map(link => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === link.path
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        {/* Language */}
                        <div className="relative hidden sm:block">
                            <button
                                onClick={() => setLangOpen(!langOpen)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <Globe className="h-4 w-4" />
                                <ChevronDown className="h-3 w-3" />
                            </button>
                            {langOpen && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl p-2 w-36 z-50">
                                    {LANGUAGES.map(l => (
                                        <button key={l} onClick={() => setLangOpen(false)} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Auth */}
                        {isLoggedIn && user ? (
                            <div className="flex items-center gap-2">
                                <button onClick={() => navigate('/profile')} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary transition-colors">
                                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                                        {user.full_name?.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium hidden sm:block">{user.full_name?.split(' ')[0]}</span>
                                </button>
                                <button onClick={handleLogout} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate('/auth')}
                                className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                            >
                                <User className="h-4 w-4" /> Sign In
                            </button>
                        )}

                        {/* Mobile menu */}
                        <button className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50" onClick={() => setMobileOpen(!mobileOpen)}>
                            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="md:hidden border-t border-gray-100 py-4 space-y-1"
                    >
                        {isLoggedIn && NAV_LINKS.map(link => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary"
                            >
                                {link.label}
                            </Link>
                        ))}
                        {user?.role === 'admin' && (
                            <Link to="/admin" className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Admin Dashboard</Link>
                        )}
                        <Link to="/architecture" className="block px-4 py-3 rounded-xl text-sm font-medium text-orange-600 hover:bg-orange-50">☁️ AWS Architecture</Link>
                    </motion.div>
                )}
            </div>
        </header>
    );
};
