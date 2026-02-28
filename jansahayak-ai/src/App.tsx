import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout/AppShell';

// Pages
import { Home } from './pages/Home';
import { AuthPage } from './pages/AuthPage';
import { AIChatPage } from './pages/AIChatPage';
import { DocumentReaderPage } from './pages/DocumentReaderPage';
import { OfficeLocatorPage } from './pages/OfficeLocatorPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboard } from './features/admin/AdminDashboard';

// Feature pages (existing)
import { SchemeFinder } from './features/schemes/SchemeFinder';
import { ApplicationGuide } from './features/applications/ApplicationGuide';
import { GrievanceHelper } from './features/grievance/GrievanceHelper';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppShell>
            <Routes>
              {/* Main */}
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<AuthPage />} />

              {/* Core Features */}
              <Route path="/schemes" element={<SchemeFinder />} />
              <Route path="/chat" element={<AIChatPage />} />
              <Route path="/documents" element={<DocumentReaderPage />} />
              <Route path="/offices" element={<OfficeLocatorPage />} />
              <Route path="/grievance" element={<GrievanceHelper />} />
              <Route path="/guide" element={<ApplicationGuide />} />

              {/* User */}
              <Route path="/profile" element={<ProfilePage />} />

              {/* Admin */}
              <Route path="/admin" element={<AdminDashboard />} />

              {/* Catch-all */}
              <Route path="*" element={<Home />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
