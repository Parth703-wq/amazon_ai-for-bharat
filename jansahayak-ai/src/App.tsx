import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout/AppShell';
import { useAuthStore } from './store/authStore';

// Pages
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { AuthPage } from './pages/AuthPage';
import { AIChatPage } from './pages/AIChatPage';
import { DocumentReaderPage } from './pages/DocumentReaderPage';
import { OfficeLocatorPage } from './pages/OfficeLocatorPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboard } from './features/admin/AdminDashboard';

// Feature pages
import { SchemeFinder } from './features/schemes/SchemeFinder';
import { ApplicationGuide } from './features/applications/ApplicationGuide';
import { GrievanceHelper } from './features/grievance/GrievanceHelper';
import { AwsArchitecturePage } from './pages/AwsArchitecturePage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

// Root page: Dashboard if logged in, Landing page if not
const RootPage = () => {
  const { isLoggedIn } = useAuthStore();
  return isLoggedIn ? <Dashboard /> : <Home />;
};

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppShell>
            <Routes>
              {/* Main — smart: Dashboard (logged in) or Landing (logged out) */}
              <Route path="/" element={<RootPage />} />
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

              {/* AWS Architecture (public — for judges) */}
              <Route path="/architecture" element={<AwsArchitecturePage />} />

              {/* Admin */}
              <Route path="/admin" element={<AdminDashboard />} />

              {/* Catch-all */}
              <Route path="*" element={<RootPage />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

