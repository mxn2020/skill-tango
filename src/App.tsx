// ═══════════════════════════════════════════════════
// Skill-Tango — App Shell
// Root layout with routing + auth guarding
// ═══════════════════════════════════════════════════

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './adapters/auth';
import { ToastProvider } from './components/ui/Toast';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { db } from './adapters/db';
import { logger } from './adapters/logger';
import './styles/tokens.css';
import './styles/global.css';

// ─── Pages (lazy-loaded later, inline for now) ───
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { GenerateCoursePage } from './pages/GenerateCoursePage';
import { MyCoursesPage } from './pages/MyCoursesPage';
import { CourseSyllabusPage } from './pages/CourseSyllabusPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LessonPage } from './pages/LessonPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { MemoryBankPage } from './pages/MemoryBankPage';

// ─── App Layout Shell ─────────────────────────────
function AppLayout() {
  const location = useLocation();

  // Don't show shell on lesson pages (immersion mode)
  const isImmersive = location.pathname.startsWith('/lesson') || location.pathname.startsWith('/onboarding');

  if (isImmersive) {
    return <Outlet />;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="app-content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}

// ─── Protected Route ──────────────────────────────
function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <motion.div
          className="app-loading__spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="4" width="14" height="14" rx="3" fill="hsl(155, 72%, 40%)" opacity="0.9" />
            <rect x="16" y="14" width="14" height="14" rx="3" fill="hsl(239, 84%, 67%)" opacity="0.9" />
          </svg>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

// ─── Root App ─────────────────────────────────────
function AppRoot() {
  useEffect(() => {
    // Seed database on first load
    db.seed().then(() => logger.info('App', 'Database ready'));
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/courses" element={<MyCoursesPage />} />
        <Route path="/generate" element={<GenerateCoursePage />} />
        <Route path="/course/:courseId" element={<CourseSyllabusPage />} />
        <Route path="/lesson/:lessonId" element={<LessonPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/memory" element={<MemoryBankPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin/prompts" element={<DashboardPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoot />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
