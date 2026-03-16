// ═══════════════════════════════════════════════════
// Skill-Tango — Stats Page
// Activity dashboard with heatmap, KPIs, and charts
// ═══════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Brain, Target, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '../adapters/db';
import { useAuth } from '../adapters/auth';
import { generateLearningInsights } from '../lib/ai';
import { GlassCard, SkeletonLoader } from '../components/ui/SharedUI';
import type { Streak, Course, MemoryItem } from '../types';
import './StatsPage.css';

export function StatsPage() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string[]>([]);
  const [chartData, setChartData] = useState<{ month: string; hours: number }[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    const [streaks, courses, memory] = await Promise.all([
      db.getAll<Streak>('streaks'),
      db.getAll<Course>('courses'),
      db.getAll<MemoryItem>('memoryItems'),
    ]);
    const s = streaks[0] || null;
    setStreak(s);

    setInsights(generateLearningInsights({
      courses, streak: s, memoryItems: memory, lifePulse: null,
      preferences: user?.preferences || { coachingStyle: 'balanced', dailyGoalMinutes: 30, enableSounds: true, theme: 'dark', interests: [] },
      userName: user?.name || 'Learner',
    }));

    // Mock chart data
    setChartData([
      { month: 'Oct', hours: 8 }, { month: 'Nov', hours: 14 },
      { month: 'Dec', hours: 11 }, { month: 'Jan', hours: 18 },
      { month: 'Feb', hours: 22 }, { month: 'Mar', hours: 16 },
    ]);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="stats">
        <h1>Activity & Stats</h1>
        <div className="stats__kpi-grid">
          {[1, 2, 3].map(i => <SkeletonLoader key={i} height={120} borderRadius="var(--radius-lg)" />)}
        </div>
        <SkeletonLoader height={200} borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  const days = streak?.activeDays || [];

  return (
    <motion.div className="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <h1>Activity & Stats</h1>

      {/* KPI Cards */}
      <div className="stats__kpi-grid">
        <GlassCard className="stats__kpi" hover={false}>
          <div className="stats__kpi-icon stats__kpi-icon--streak"><Flame size={24} /></div>
          <motion.span className="stats__kpi-value" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {streak?.currentStreak || 0}
          </motion.span>
          <span className="stats__kpi-label">Day Streak 🔥</span>
        </GlassCard>

        <GlassCard className="stats__kpi" hover={false}>
          <div className="stats__kpi-icon stats__kpi-icon--concepts"><Brain size={24} /></div>
          <motion.span className="stats__kpi-value" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {streak?.totalSessions || 0}
          </motion.span>
          <span className="stats__kpi-label">Sessions Completed</span>
        </GlassCard>

        <GlassCard className="stats__kpi" hover={false}>
          <div className="stats__kpi-icon stats__kpi-icon--score"><Target size={24} /></div>
          <motion.span className="stats__kpi-value" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            92%
          </motion.span>
          <span className="stats__kpi-label">Average Score</span>
        </GlassCard>
      </div>

      {/* Heatmap */}
      <section className="stats__heatmap-section">
        <h3>Activity Heatmap</h3>
        <div className="stats__heatmap-scroll">
          <div className="stats__heatmap">
            {days.concat(Array.from({ length: Math.max(0, 90 - days.length) }, (_, i) => ({
              date: new Date(Date.now() - (days.length + i) * 86400000).toISOString(),
              sessionsCompleted: 0, minutesSpent: 0, lessonsCompleted: 0, xpEarned: 0,
            }))).reverse().map((day, i) => {
              const intensity = day.sessionsCompleted === 0 ? 0 : day.sessionsCompleted >= 4 ? 3 : day.sessionsCompleted >= 2 ? 2 : 1;
              return (
                <div
                  key={i}
                  className={`stats__heatmap-cell stats__heatmap-cell--${intensity}`}
                  title={`${new Date(day.date).toLocaleDateString()}: ${day.sessionsCompleted} sessions, ${day.minutesSpent} min`}
                />
              );
            })}
          </div>
        </div>
        <div className="stats__heatmap-legend">
          <span>Less</span>
          <div className="stats__heatmap-cell stats__heatmap-cell--0" />
          <div className="stats__heatmap-cell stats__heatmap-cell--1" />
          <div className="stats__heatmap-cell stats__heatmap-cell--2" />
          <div className="stats__heatmap-cell stats__heatmap-cell--3" />
          <span>More</span>
        </div>
      </section>

      {/* AI Insights */}
      <section className="stats__insights">
        <h3><Sparkles size={16} /> AI Learning Insights</h3>
        <div className="stats__insights-grid">
          {insights.map((insight, i) => (
            <motion.div key={i} className="stats__insight-card" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}>
              <p>{insight}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Progress Chart */}
      <section className="stats__chart-section">
        <h3>Learning Hours</h3>
        <div className="stats__chart">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(155, 72%, 40%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(155, 72%, 40%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated-2)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }} />
              <Area type="monotone" dataKey="hours" stroke="hsl(155, 72%, 40%)" fill="url(#emeraldGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </motion.div>
  );
}
