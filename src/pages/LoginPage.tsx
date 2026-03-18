// ═══════════════════════════════════════════════════
// Skill-Tango — Login Page
// Split-screen with immersive CSS gradient hero
// ═══════════════════════════════════════════════════

import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../adapters/auth';
import './LoginPage.css';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('alex@skill-tango.app');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // Navigation handled by the useEffect above reacting to isAuthenticated
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      {/* Hero side */}
      <div className="login__hero">
        <div className="login__hero-content">
          <motion.div
            className="login__neural-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
          >
            {/* Animated background elements */}
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                className="login__neural-node"
                style={{
                  left: `${15 + (i % 3) * 30}%`,
                  top: `${20 + Math.floor(i / 3) * 35}%`,
                }}
                animate={{
                  opacity: [0.2, 0.6, 0.2],
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.3,
                }}
              />
            ))}
          </motion.div>

          <motion.div
            className="login__hero-text"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <div className="login__hero-logo">
              <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
                <rect x="2" y="4" width="14" height="14" rx="3" fill="hsl(155, 72%, 40%)" opacity="0.9" />
                <rect x="16" y="14" width="14" height="14" rx="3" fill="hsl(239, 84%, 67%)" opacity="0.9" />
              </svg>
              <span>Skill-Tango</span>
            </div>
            <h1>Master anything.<br />One session at a time.</h1>
            <p>AI-powered courses, spaced repetition, and personalized learning paths — built for obsessive learners.</p>
          </motion.div>
        </div>
      </div>

      {/* Form side */}
      <div className="login__form-side">
        <motion.div
          className="login__form-container"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <h2>Log into your learning hub.</h2>
          <p className="login__subtitle">Continue your streak and keep mastering.</p>

          <form onSubmit={handleSubmit} className="login__form">
            <div className="login__field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@skill-tango.app"
                required
                autoFocus
              />
            </div>

            <div className="login__field">
              <label htmlFor="password">Password</label>
              <div className="login__password-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="login__password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                className="login__error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              className="btn btn--primary btn--full btn--lg login__submit"
              disabled={loading || !email}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
            >
              <Sparkles size={18} />
              {loading ? 'Signing in...' : 'Start Learning'}
            </motion.button>
          </form>

          <p className="login__footer">© 2026 Skill-Tango Inc.</p>
        </motion.div>
      </div>
    </div>
  );
}
