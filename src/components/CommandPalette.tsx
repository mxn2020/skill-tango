// ═══════════════════════════════════════════════════
// Skill-Tango — Command Palette (Cmd+K)
// Glassmorphism search across courses, lessons, actions
// ═══════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, BookOpen, FileText, Settings, Activity, Brain,
  Sparkles, Moon, Terminal, Zap,
} from 'lucide-react';
import { db } from '../adapters/db';
import type { Course } from '../types';
import './CommandPalette.css';

interface CommandItem {
  id: string;
  section: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    db.getAll<Course>('courses').then(setCourses);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const go = useCallback((path: string) => { navigate(path); onClose(); }, [navigate, onClose]);

  const allItems = useMemo((): CommandItem[] => {
    const items: CommandItem[] = [];

    // Courses
    courses.forEach(c => {
      items.push({
        id: `course-${c.id}`,
        section: 'COURSES',
        icon: <BookOpen size={16} />,
        title: c.title,
        subtitle: `${c.modules.length} modules · ${c.difficulty}`,
        action: () => go(`/course/${c.id}`),
      });
    });

    // Lessons (first 2 per course)
    courses.forEach(c => {
      c.modules.slice(0, 1).forEach(m => {
        m.lessons.slice(0, 2).forEach(l => {
          items.push({
            id: `lesson-${l.id}`,
            section: 'LESSONS',
            icon: <FileText size={16} />,
            title: `${l.title} — ${m.title}`,
            subtitle: c.title,
            action: () => go(`/lesson/${l.id}`),
          });
        });
      });
    });

    // Actions
    items.push(
      { id: 'act-generate', section: 'ACTIONS', icon: <Sparkles size={16} />, title: 'Generate Course', action: () => go('/generate') },
      { id: 'act-stats', section: 'ACTIONS', icon: <Activity size={16} />, title: 'View Stats', action: () => go('/stats') },
      { id: 'act-memory', section: 'ACTIONS', icon: <Brain size={16} />, title: 'Memory Bank', action: () => go('/memory') },
      { id: 'act-settings', section: 'ACTIONS', icon: <Settings size={16} />, title: 'Open Settings', action: () => go('/settings') },
      { id: 'act-theme', section: 'ACTIONS', icon: <Moon size={16} />, title: 'Toggle Theme', action: () => { document.documentElement.classList.toggle('light'); onClose(); } },
      { id: 'act-admin', section: 'ADMIN', icon: <Terminal size={16} />, title: 'Open Prompt Sandbox', action: () => go('/admin/prompts') },
    );

    return items;
  }, [courses, go, onClose]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.subtitle?.toLowerCase().includes(q) ||
      i.section.toLowerCase().includes(q),
    );
  }, [allItems, query]);

  // Group by section
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filtered.forEach(item => {
      if (!map.has(item.section)) map.set(item.section, []);
      map.get(item.section)!.push(item);
    });
    return map;
  }, [filtered]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      else if (e.key === 'Enter') { e.preventDefault(); filtered[selectedIndex]?.action(); }
      else if (e.key === 'Escape') { onClose(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, filtered, selectedIndex, onClose]);

  // Reset selection on query change
  useEffect(() => { setSelectedIndex(0); }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cmdpal__overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="cmdpal__card"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="cmdpal__search-wrap">
              <Search size={18} />
              <input
                ref={inputRef}
                className="cmdpal__search"
                placeholder="Search courses, lessons, settings..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <kbd className="cmdpal__esc">Esc</kbd>
            </div>

            <div className="cmdpal__results">
              {filtered.length === 0 ? (
                <div className="cmdpal__empty">
                  <Search size={24} />
                  <span>No matches found. Try a different search.</span>
                </div>
              ) : (
                Array.from(grouped.entries()).map(([section, items]) => (
                  <div key={section} className="cmdpal__section">
                    <div className="cmdpal__section-label">{section}</div>
                    {items.map(item => {
                      const flatIdx = filtered.indexOf(item);
                      return (
                        <button
                          key={item.id}
                          className={`cmdpal__item ${flatIdx === selectedIndex ? 'cmdpal__item--active' : ''}`}
                          onClick={item.action}
                          onMouseEnter={() => setSelectedIndex(flatIdx)}
                        >
                          <span className="cmdpal__item-icon">{item.icon}</span>
                          <div className="cmdpal__item-text">
                            <span className="cmdpal__item-title">{item.title}</span>
                            {item.subtitle && <span className="cmdpal__item-sub">{item.subtitle}</span>}
                          </div>
                          {flatIdx === selectedIndex && <Zap size={12} className="cmdpal__item-enter" />}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
