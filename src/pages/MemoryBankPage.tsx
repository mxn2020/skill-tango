// ═══════════════════════════════════════════════════
// Skill-Tango — Memory Bank Page
// Spaced Repetition Visualization
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Clock, RotateCcw, Zap, ChevronRight } from 'lucide-react';
import { db } from '../adapters/db';
import { useToast } from '../components/ui/Toast';
import type { MemoryItem } from '../types';
import './MemoryBankPage.css';

// ─── Helpers ──────────────────────────────────────

function strengthColor(strength: number): string {
  if (strength >= 80) return 'hsl(155, 72%, 40%)';
  if (strength >= 60) return 'hsl(195, 85%, 50%)';
  if (strength >= 40) return 'hsl(43, 96%, 56%)';
  return 'hsl(350, 65%, 55%)';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

// ─── Memory Ring Component ────────────────────────

function MemoryRing({ value, size = 36 }: { value: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="memory-ring">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="var(--bg-elevated-3)" strokeWidth={4}
      />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={strengthColor(value)} strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        fontSize={size * 0.28} fontWeight={700}
        fill={strengthColor(value)}
      >
        {value}
      </text>
    </svg>
  );
}

// ─── Component ────────────────────────────────────

export function MemoryBankPage() {
  const { addToast } = useToast();
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fastForwarding, setFastForwarding] = useState(false);

  useEffect(() => {
    db.getAll<MemoryItem>('memoryItems').then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const needsReview = items.filter(i => i.memoryStrength < 60);
  const strong = items.filter(i => i.memoryStrength >= 60);
  const avgStrength = items.length > 0
    ? Math.round(items.reduce((s, i) => s + i.memoryStrength, 0) / items.length)
    : 0;

  const handleFastForward = useCallback(async () => {
    setFastForwarding(true);
    // Decay all items by 20-30%
    const updated = items.map(item => ({
      ...item,
      memoryStrength: Math.max(5, item.memoryStrength - Math.floor(20 + Math.random() * 10)),
      lastReviewed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    }));

    // Update in DB
    for (const item of updated) {
      await db.update('memoryItems', item.id, item);
    }

    setItems(updated);
    setTimeout(() => setFastForwarding(false), 600);

    const needReview = updated.filter(i => i.memoryStrength < 60).length;
    addToast({
      type: 'warning',
      title: 'Memory decay simulated',
      message: `${needReview} concept${needReview !== 1 ? 's' : ''} need review.`,
    });
  }, [items, addToast]);

  const handleReview = useCallback((id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? {
            ...item,
            memoryStrength: Math.min(100, item.memoryStrength + 25),
            lastReviewed: new Date().toISOString(),
            repetitions: item.repetitions + 1,
          }
        : item,
    ));
    addToast({ type: 'success', title: 'Concept reviewed! Memory strengthened.' });
  }, [addToast]);

  if (loading) {
    return (
      <div className="memory-bank">
        <div className="memory-bank__header">
          <h1><Brain size={28} /> Memory Bank</h1>
        </div>
        <div className="memory-bank__skeleton">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="memory-bank__skeleton-row" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="memory-bank">
      {/* Header */}
      <div className="memory-bank__header">
        <div>
          <h1><Brain size={28} /> Memory Bank</h1>
          <p className="memory-bank__subtitle">Track your knowledge retention with spaced repetition</p>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="memory-bank__kpis">
        <motion.div className="memory-bank__kpi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <span className="memory-bank__kpi-value">{items.length}</span>
          <span className="memory-bank__kpi-label">Concepts</span>
        </motion.div>
        <motion.div className="memory-bank__kpi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <span className="memory-bank__kpi-value" style={{ color: strengthColor(avgStrength) }}>{avgStrength}%</span>
          <span className="memory-bank__kpi-label">Avg Strength</span>
        </motion.div>
        <motion.div className="memory-bank__kpi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <span className="memory-bank__kpi-value" style={{ color: needsReview.length > 0 ? 'var(--color-warning)' : 'var(--color-primary)' }}>{needsReview.length}</span>
          <span className="memory-bank__kpi-label">Need Review</span>
        </motion.div>
      </div>

      {/* Needs Review Section */}
      {needsReview.length > 0 && (
        <section className="memory-bank__section">
          <h2 className="memory-bank__section-title">
            <Clock size={18} /> Needs Review
            <span className="memory-bank__section-count">{needsReview.length}</span>
          </h2>
          <div className="memory-bank__list">
            <AnimatePresence>
              {needsReview.map((item, i) => (
                <motion.div
                  key={item.id}
                  className={`memory-bank__item ${item.memoryStrength < 40 ? 'memory-bank__item--urgent' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  layout
                >
                  <MemoryRing value={item.memoryStrength} />
                  <div className="memory-bank__item-info">
                    <span className="memory-bank__item-name">{item.conceptName}</span>
                    <span className="memory-bank__item-meta">
                      Last reviewed: {timeAgo(item.lastReviewed)} · {item.repetitions} reviews
                    </span>
                  </div>
                  <motion.button
                    className="btn btn--ghost memory-bank__review-btn"
                    onClick={() => handleReview(item.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <RotateCcw size={14} /> Review Now
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Strong Concepts */}
      <section className="memory-bank__section">
        <h2 className="memory-bank__section-title">
          <ChevronRight size={18} /> Solid Concepts
          <span className="memory-bank__section-count">{strong.length}</span>
        </h2>
        <div className="memory-bank__list">
          {strong.map((item, i) => (
            <motion.div
              key={item.id}
              className="memory-bank__item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              layout
            >
              <MemoryRing value={item.memoryStrength} />
              <div className="memory-bank__item-info">
                <span className="memory-bank__item-name">{item.conceptName}</span>
                <span className="memory-bank__item-meta">
                  Last reviewed: {timeAgo(item.lastReviewed)} · {item.repetitions} reviews
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Developer Fast Forward Widget */}
      <motion.button
        className="memory-bank__fast-forward"
        onClick={handleFastForward}
        disabled={fastForwarding}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Zap size={16} />
        {fastForwarding ? 'Simulating...' : 'Fast Forward: +3 Days'}
      </motion.button>
    </div>
  );
}
