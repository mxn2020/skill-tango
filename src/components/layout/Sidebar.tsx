// ═══════════════════════════════════════════════════
// Skill-Tango — Sidebar Navigation
// Collapsible with Framer Motion + layoutId
// ═══════════════════════════════════════════════════

import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  Activity,
  Settings,
  Terminal,
  ChevronLeft,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../adapters/auth';
import { Avatar, Badge } from '../ui/SharedUI';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/courses', label: 'My Courses', icon: BookOpen },
  { path: '/generate', label: 'Generate Course', icon: Sparkles },
  { path: '/stats', label: 'Activity & Stats', icon: Activity },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const ADMIN_ITEM = { path: '/admin/prompts', label: 'Admin Sandbox', icon: Terminal };

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <motion.aside
      className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Logo */}
      <div className="sidebar__logo">
        <div className="sidebar__logo-mark">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="4" width="14" height="14" rx="3" fill="hsl(155, 72%, 40%)" opacity="0.9" />
            <rect x="16" y="14" width="14" height="14" rx="3" fill="hsl(239, 84%, 67%)" opacity="0.9" />
          </svg>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              className="sidebar__logo-text"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              Skill-Tango
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
              title={item.label}
            >
              {isActive && (
                <motion.div
                  className="sidebar__active-pill"
                  layoutId="sidebar-active-pill"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon size={20} className="sidebar__icon" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    className="sidebar__label"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}

        {/* Admin item — only for Owner role */}
        {user?.role === 'Owner' && (
          <>
            <div className="sidebar__divider" />
            <NavLink
              to={ADMIN_ITEM.path}
              className={`sidebar__link ${location.pathname.startsWith(ADMIN_ITEM.path) ? 'sidebar__link--active' : ''}`}
              title={ADMIN_ITEM.label}
            >
              {location.pathname.startsWith(ADMIN_ITEM.path) && (
                <motion.div
                  className="sidebar__active-pill"
                  layoutId="sidebar-active-pill"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <ADMIN_ITEM.icon size={20} className="sidebar__icon" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    className="sidebar__label"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {ADMIN_ITEM.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <button
        className="sidebar__collapse-btn"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
          <ChevronLeft size={18} />
        </motion.div>
      </button>

      {/* User section */}
      <div className="sidebar__user">
        <Avatar name={user?.name || 'User'} size={36} showStatus status="online" />
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              className="sidebar__user-info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="sidebar__user-name">{user?.name}</span>
              <Badge variant="primary" size="xs">
                {user?.plan?.toUpperCase()}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {!collapsed && (
            <motion.button
              className="sidebar__logout-btn"
              onClick={logout}
              aria-label="Sign out"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileTap={{ scale: 0.9 }}
            >
              <LogOut size={16} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
