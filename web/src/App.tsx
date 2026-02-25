import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BrainCircuit } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useConvexAuth, useQuery } from 'convex/react'
import { useAuthActions } from "@convex-dev/auth/react"
import { api } from '../convex/_generated/api'
import LandingPage from './pages/LandingPage'
import AppHome from './pages/AppHome'
import LoginPage from './pages/LoginPage'
import PricingPage from './pages/PricingPage'
import HelpPage from './pages/HelpPage'
import AdminPage from './pages/AdminPage'
import AuditLogsPage from './pages/AuditLogsPage'
import { type ReactNode } from 'react'

function Layout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth()
  const { signOut } = useAuthActions()
  const me = useQuery(api.users.getMe)
  const navigate = useNavigate()

  return (
    <div className="app">
      <header className="app__header">
        <Link to="/" className="app__logo">
          <BrainCircuit className="app__logo-icon" />
          Skill-Tango
        </Link>
        <nav className="app__nav">
          <Link to="/" className="app__nav-link">Home</Link>
          {isAuthenticated && <Link to="/app" className="app__nav-link">My Courses</Link>}
          <Link to="/pricing" className="app__nav-link">Pricing</Link>
          <Link to="/help" className="app__nav-link">Help</Link>
          {isAuthenticated && me?.role === 'admin' && (
            <>
              <Link to="/admin" className="app__nav-link">⚙️ Admin</Link>
              <Link to="/audit-logs" className="app__nav-link">📋 Logs</Link>
            </>
          )}
          {isAuthenticated ? (
            <button className="app__nav-link" onClick={() => { signOut(); navigate('/'); }}>
              Sign Out
            </button>
          ) : (
            <Link to="/login" className="app__nav-link">Sign In</Link>
          )}
        </nav>
      </header>

      <main className="app__main container" style={{ marginTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
        {children}
      </main>

      <footer className="app__footer" style={{ textAlign: 'center', padding: '24px', color: '#666', fontSize: '0.85rem' }}>
        <p>Skill-Tango — AI-powered personalized learning</p>
      </footer>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<AppHome />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
