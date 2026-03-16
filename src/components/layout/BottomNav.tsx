// ═══════════════════════════════════════════════════
// Skill-Tango — Bottom Navigation (Mobile)
// ═══════════════════════════════════════════════════

import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, BookOpen, Sparkles, Activity, Menu } from 'lucide-react';
import './BottomNav.css';

const TABS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/courses', label: 'Courses', icon: BookOpen },
  { path: '/generate', label: 'Generate', icon: Sparkles, primary: true },
  { path: '/stats', label: 'Stats', icon: Activity },
  { path: '/settings', label: 'More', icon: Menu },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {TABS.map((tab) => {
        const isActive = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/');
        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={`bottom-nav__tab ${isActive ? 'bottom-nav__tab--active' : ''} ${tab.primary ? 'bottom-nav__tab--primary' : ''}`}
          >
            <motion.div
              className="bottom-nav__icon"
              whileTap={{ scale: 0.85 }}
              animate={isActive ? { y: -2 } : { y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <tab.icon size={tab.primary ? 24 : 20} />
            </motion.div>
            <span className="bottom-nav__label">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
