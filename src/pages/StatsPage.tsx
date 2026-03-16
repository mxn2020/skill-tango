// ═══════════════════════════════════════════════════
// Skill-Tango — Activity & Stats Page
// KPI cards, GitHub-style heatmap, Recharts progress chart
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Flame, Brain, Target, Sparkles, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { db } from '../adapters/db';
import type { Streak, ActivityDay } from '../types';
import './StatsPage.css';

// ─── Odometer Number ──────────────────────────────

function OdometerNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <>{display}</>;
}

// ─── Heatmap Tooltip ──────────────────────────────

function HeatmapDay({ day, index }: { day: ActivityDay; index: number }) {
  const [hover, setHover] = useState(false);
  const sessions = day.sessionsCompleted;
  const level =
    sessions === 0 ? 0 : sessions <= 1 ? 1 : sessions <= 3 ? 2 : 3;

  return (
    <div
      className={`stats__heat-cell stats__heat-cell--${level}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ animationDelay: `${index * 10}ms` }}
    >
      {hover && (
        <motion.div
          className="stats__heat-tooltip"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <strong>{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong>
          <span>{sessions} lesson{sessions !== 1 ? 's' : ''} · {day.minutesSpent}m</span>
        </motion.div>
      )}
    </div>
  );
}

// ─── Chart Data ───────────────────────────────────

const CHART_DATA = [
  { month: 'Oct', hours: 8.2, sessions: 12 },
  { month: 'Nov', hours: 14.5, sessions: 21 },
  { month: 'Dec', hours: 11.3, sessions: 16 },
  { month: 'Jan', hours: 18.7, sessions: 28 },
  { month: 'Feb', hours: 22.1, sessions: 34 },
  { month: 'Mar', hours: 16.5, sessions: 24 },
];

// ─── AI Insights ──────────────────────────────────

const INSIGHTS = [
  { text: 'Your lessons with code examples have 40% higher retention rates.', trend: '+40%' },
  { text: 'TypeScript Mastery is your strongest domain. Consider advancing to production patterns.', trend: '92%' },
  { text: 'Italian vocabulary review is overdue by 4 days. Your memory strength is declining.', trend: '-18%' },
];

// ─── Custom Tooltip ───────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="stats__chart-tooltip">
      <strong>{label}</strong>
      <span>{payload[0].value.toFixed(1)} hours</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────

export function StatsPage() {
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getAll<Streak>('streaks').then(data => {
      if (data.length > 0) setStreak(data[0]);
      setLoading(false);
    });
  }, []);

  const getMasteredCount = useCallback(() => 47, []);
  const getAvgScore = useCallback(() => 92, []);

  // ─── Loading State ──────────────────────────────
  if (loading) {
    return (
      <div className="stats">
        <h1 className="stats__title">Activity & Stats</h1>
        <div className="stats__kpis">
          {[1, 2, 3].map(i => <div key={i} className="stats__kpi-skeleton" />)}
        </div>
        <div className="stats__heatmap-skeleton" />
      </div>
    );
  }

  if (!streak) {
    return (
      <div className="stats stats--empty">
        <TrendingUp size={48} />
        <h2>Start your first lesson to see stats here.</h2>
        <a href="/generate" className="btn btn--primary">Generate a Course</a>
      </div>
    );
  }

  const activeDays = streak.activeDays || [];
  // Build weeks from the last 90 days
  const weeks: ActivityDay[][] = [];
  for (let i = 0; i < activeDays.length; i += 7) {
    weeks.push(activeDays.slice(i, i + 7));
  }

  return (
    <div className="stats">
      <h1 className="stats__title">Activity & Stats</h1>

      {/* ─── KPI Cards ─── */}
      <div className="stats__kpis">
        <motion.div
          className="stats__kpi stats__kpi--streak"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -3 }}
        >
          <div className="stats__kpi-icon stats__kpi-icon--fire">
            <Flame size={24} />
          </div>
          <div className="stats__kpi-number"><OdometerNumber value={streak.currentStreak} /></div>
          <div className="stats__kpi-label">Day Streak</div>
        </motion.div>

        <motion.div
          className="stats__kpi"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -3 }}
        >
          <div className="stats__kpi-icon"><Brain size={24} /></div>
          <div className="stats__kpi-number"><OdometerNumber value={getMasteredCount()} /></div>
          <div className="stats__kpi-label">Concepts Mastered</div>
        </motion.div>

        <motion.div
          className="stats__kpi stats__kpi--score"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -3 }}
        >
          <div className="stats__kpi-icon"><Target size={24} /></div>
          <div className="stats__kpi-number"><OdometerNumber value={getAvgScore()} /><span className="stats__kpi-percent">%</span></div>
          <div className="stats__kpi-label">Average Score</div>
          {/* Mini ring */}
          <svg className="stats__score-ring" width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="var(--bg-elevated-3)" strokeWidth={3} />
            <circle
              cx="28" cy="28" r="24" fill="none"
              stroke="hsl(155, 72%, 40%)" strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 24 * 0.92} ${2 * Math.PI * 24 * 0.08}`}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          </svg>
        </motion.div>
      </div>

      {/* ─── Heatmap ─── */}
      <section className="stats__section">
        <h2>Learning Activity</h2>
        <div className="stats__heatmap-scroll">
          <div className="stats__heatmap">
            <div className="stats__heat-labels">
              <span>Mon</span><span>Wed</span><span>Fri</span>
            </div>
            <div className="stats__heat-grid">
              {activeDays.map((day, i) => (
                <HeatmapDay key={i} day={day} index={i} />
              ))}
            </div>
          </div>
        </div>
        <div className="stats__heat-legend">
          <span>Less</span>
          <div className="stats__heat-cell stats__heat-cell--0" />
          <div className="stats__heat-cell stats__heat-cell--1" />
          <div className="stats__heat-cell stats__heat-cell--2" />
          <div className="stats__heat-cell stats__heat-cell--3" />
          <span>More</span>
        </div>
      </section>

      {/* ─── Progress Over Time ─── */}
      <section className="stats__section">
        <h2>Progress Over Time</h2>
        <div className="stats__chart-wrap">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(155, 72%, 40%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(155, 72%, 40%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(220, 20%, 30%, 0.3)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="hsl(155, 72%, 40%)"
                fill="url(#chartGradient)"
                strokeWidth={2}
                dot={{ r: 4, fill: 'hsl(155, 72%, 40%)', strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--bg-base)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ─── AI Learning Insights ─── */}
      <section className="stats__section">
        <h2><Sparkles size={20} /> AI Learning Insights</h2>
        <div className="stats__insights">
          {INSIGHTS.map((insight, i) => (
            <motion.div
              key={i}
              className="stats__insight"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <div className="stats__insight-body">
                <p>{insight.text}</p>
              </div>
              <div className={`stats__insight-trend ${parseFloat(insight.trend) < 0 ? 'stats__insight-trend--neg' : ''}`}>
                {insight.trend}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
