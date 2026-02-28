import React from 'react';
import { Navbar } from './Navbar';

interface AppShellProps {
    children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Navbar />
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
};
