import React from 'react';
import { Navbar } from './Navbar';
import { MobileBottomNav } from './MobileBottomNav';

interface AppShellProps {
    children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Navbar />
            <main className="flex-1 pb-16 md:pb-0">
                {children}
            </main>
            <MobileBottomNav />
        </div>
    );
};
