/* ============================================================
   Mobile Bottom Navigation — visible only on screens < 768px
   Features: Home, Schemes, Chat, Offices, Profile with active state
   ============================================================ */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, MessageCircle, MapPin, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const NAV_ITEMS = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/schemes', icon: Search, label: 'Schemes' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/offices', icon: MapPin, label: 'Offices' },
    { path: '/profile', icon: User, label: 'Profile' },
];

export const MobileBottomNav = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { isLoggedIn } = useAuthStore();

    // Only show when logged in
    if (!isLoggedIn) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="flex items-center justify-around px-2 py-1 safe-area-inset-bottom">
                {NAV_ITEMS.map(item => {
                    const isActive = pathname === item.path ||
                        (item.path !== '/' && pathname.startsWith(item.path));
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl min-w-[56px] transition-all ${isActive
                                    ? 'text-primary bg-primary/10'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <item.icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                            <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
