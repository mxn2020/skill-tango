// ═══════════════════════════════════════════════════
// Skill-Tango — Dashboard Page
// AI-driven daily learning hub
// ═══════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Play, Plus, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { db } from '../adapters/db';
import { useAuth } from '../adapters/auth';
import { generateBriefing } from '../lib/ai';
import { GlassCard, ProgressRing, ProgressBar, Badge, SkeletonLoader } from '../components/ui/SharedUI';
import type { Course, Streak, MemoryItem, LifePulseData, AIBriefing } from '../types';
import './DashboardPage.css';

const SKILL_COLORS = [
  'var(--color-primary)',      // Emerald
  'var(--color-secondary)',    // Indigo
  'var(--color-warning)',      // Amber
  'var(--color-info)',         // Sky
];

export function DashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [briefing, setBriefing] = useState<AIBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [lifePulseStatus, setLifePulseStatus] = useState<'optimal' | 'overloaded'>('optimal');

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [coursesData, streaksData, memoryData, lpData] = await Promise.all([
        db.getAll<Course>('courses'),
        db.getAll<Streak>('streaks'),
        db.getAll<MemoryItem>('memoryItems'),
        db.getAll<LifePulseData>('lifepulse'),
      ]);
      const activeCourses = coursesData.filter((c) => !c.archived);
      setCourses(activeCourses);
      const s = streaksData[0] || null;
      setStreak(s);

      // Generate AI briefing from real data
      const brief = generateBriefing({
        courses: activeCourses,
        streak: s,
        memoryItems: memoryData,
        lifePulse: lpData[0] || null,
        preferences: user?.preferences || { coachingStyle: 'balanced', dailyGoalMinutes: 30, enableSounds: true, theme: 'dark', interests: [] },
        userName: user?.name || 'Learner',
      });
      setBriefing(brief);
    } finally {
      setLoading(false);
    }
  }

  const toggleLifePulse = () => {
    setLifePulseStatus((s) => (s === 'optimal' ? 'overloaded' : 'optimal'));
  };

  // Calculate course progress
  function getCourseProgress(course: Course): number {
    const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
    const completed = course.modules.reduce((s, m) => s + m.lessons.filter((l) => l.status === 'completed').length, 0);
    return totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
  }

  if (loading) {
    return (
      <div className="dashboard">
        <SkeletonLoader height={120} borderRadius="var(--radius-xl)" />
        <SkeletonLoader height={160} borderRadius="var(--radius-xl)" />
        <div className="dashboard__skills-skeleton">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonLoader key={i} height={100} borderRadius="var(--radius-lg)" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Top bar info */}
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Dashboard</h1>
          <p className="dashboard__subtitle">Your learning command center</p>
        </div>
        <button
          className={`lifepulse-pill lifepulse-pill--${lifePulseStatus}`}
          onClick={toggleLifePulse}
          title="Toggle LifePulse status for testing"
        >
          <span className="lifepulse-pill__dot" />
          {lifePulseStatus === 'optimal' ? 'Optimal Load' : 'Overloaded'}
        </button>
      </div>

      {/* AI Briefing Card */}
      {briefing && (
        <motion.div
          className="dashboard__briefing"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="dashboard__briefing-header">
            <Sparkles size={18} />
            <span>AI Daily Briefing</span>
          </div>
          <p className="dashboard__briefing-greeting">{briefing.greeting}</p>
          <p className="dashboard__briefing-insight">{briefing.insight}</p>
          <p className="dashboard__briefing-suggestion">{briefing.suggestion}</p>
          <p className="dashboard__briefing-encouragement">{briefing.encouragement}</p>
        </motion.div>
      )}

      {/* Today's Target Hero Card */}
      <GlassCard className="dashboard__target" hover={false}>
        <div className="dashboard__target-content">
          <Badge variant="primary" size="sm">Today's Focus</Badge>
          <h2>Review Session: JavaScript Closures</h2>
          <p>You struggled with scoped functions yesterday. Let's solidify.</p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Link to="/lesson/review-closures" className="btn btn--primary btn--lg dashboard__target-btn">
              <Play size={18} />
              Start Session
            </Link>
          </motion.div>
        </div>
        <div className="dashboard__target-meta">
          <span><Clock size={14} /> ~12 min</span>
          <span><TrendingUp size={14} /> +35 XP</span>
        </div>
      </GlassCard>

      {/* Skill Rings */}
      <section className="dashboard__skills">
        <h3 className="dashboard__section-title">Skill Rings</h3>
        <div className="dashboard__skills-grid">
          {courses.slice(0, 4).map((course, i) => {
            const progress = getCourseProgress(course);
            return (
              <motion.div
                key={course.id}
                className="dashboard__skill-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
                whileHover={{ scale: 1.03 }}
              >
                <ProgressRing value={progress} size={64} color={SKILL_COLORS[i % 4]} strokeWidth={5} />
                <span className="dashboard__skill-name">{course.title.split(' ')[0]}</span>
                <span className="dashboard__skill-pct">{progress}%</span>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Active Courses (horizontal scroll) */}
      <section className="dashboard__courses">
        <div className="dashboard__section-header">
          <h3 className="dashboard__section-title">Active Courses</h3>
          <Link to="/courses" className="dashboard__section-link">
            View All <ChevronRight size={14} />
          </Link>
        </div>
        <div className="dashboard__courses-scroll">
          {courses.map((course, i) => {
            const progress = getCourseProgress(course);
            const currentModule = course.modules.findIndex(
              (m) => m.lessons.some((l) => l.status === 'available')
            );
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <Link to={`/course/${course.id}`} className="dashboard__course-card">
                  <div className="dashboard__course-cover" style={{ background: course.coverGradient }} />
                  <div className="dashboard__course-info">
                    <span className="dashboard__course-title">{course.title}</span>
                    <ProgressBar value={progress} height={3} />
                    <span className="dashboard__course-continue">
                      {progress > 0 ? `Continue module ${(currentModule > -1 ? currentModule : 0) + 1}` : 'Start course'}
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}

          {/* Add course card */}
          <Link to="/generate" className="dashboard__course-card dashboard__course-card--add">
            <Plus size={28} />
            <span>Generate Course</span>
          </Link>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="dashboard__activity">
        <h3 className="dashboard__section-title">Recent Activity</h3>
        <div className="dashboard__activity-list">
          {streak?.activeDays.slice(0, 4).map((day, i) => (
            <motion.div
              key={day.date}
              className="dashboard__activity-item"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <div className="dashboard__activity-dot" />
              <div className="dashboard__activity-content">
                <span className="dashboard__activity-label">
                  {i === 0 ? 'Today' : i === 1 ? 'Yesterday' : `${i} days ago`}
                </span>
                <span className="dashboard__activity-detail">
                  {day.lessonsCompleted} lesson{day.lessonsCompleted !== 1 ? 's' : ''} completed • {day.minutesSpent} min
                </span>
              </div>
              <Badge variant="success" size="xs">+{day.xpEarned} XP</Badge>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
