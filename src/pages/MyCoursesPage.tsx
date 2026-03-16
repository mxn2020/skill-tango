// ═══════════════════════════════════════════════════
// Skill-Tango — My Courses Page
// Course library grid with context menus
// ═══════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, MoreVertical, Archive, RotateCcw, Share2, Sparkles } from 'lucide-react';
import { db } from '../adapters/db';
import { useToast } from '../components/ui/Toast';
import { Badge, ProgressBar, SkeletonLoader, EmptyState } from '../components/ui/SharedUI';
import type { Course } from '../types';
import './MyCoursesPage.css';

export function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    const data = await db.getAll<Course>('courses');
    setCourses(data.filter((c) => !c.archived));
    setLoading(false);
  }

  function getCourseProgress(course: Course): number {
    const total = course.modules.reduce((s, m) => s + m.lessons.length, 0);
    const done = course.modules.reduce((s, m) => s + m.lessons.filter((l) => l.status === 'completed').length, 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }

  async function archiveCourse(id: string) {
    await db.update('courses', id, { archived: true });
    setCourses((prev) => prev.filter((c) => c.id !== id));
    addToast({ type: 'success', title: 'Course archived' });
    setMenuOpen(null);
  }

  if (loading) {
    return (
      <div className="courses-page">
        <h1>My Courses</h1>
        <div className="courses-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonLoader key={i} height={220} borderRadius="var(--radius-lg)" />
          ))}
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="courses-page">
        <h1>My Courses</h1>
        <EmptyState
          icon={Sparkles}
          title="Your learning journey is a blank slate."
          description="Generate your first AI-powered course and start mastering something new."
          action={() => window.location.href = '/generate'}
          actionLabel="Generate Your First Course →"
        />
      </div>
    );
  }

  return (
    <motion.div
      className="courses-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1>My Courses</h1>
      <div className="courses-grid">
        {courses.map((course, i) => {
          const progress = getCourseProgress(course);
          const currentModule = course.modules.findIndex(m => m.lessons.some(l => l.status === 'available'));
          return (
            <motion.div
              key={course.id}
              className="course-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              whileHover={{ y: -3 }}
            >
              <Link to={`/course/${course.id}`} className="course-card__link">
                <div className="course-card__cover" style={{ background: course.coverGradient }} />
                <div className="course-card__body">
                  <h3 className="course-card__title">{course.title}</h3>
                  <Badge variant={course.difficulty === 'beginner' ? 'success' : course.difficulty === 'intermediate' ? 'warning' : 'error'} size="xs">
                    {course.difficulty}
                  </Badge>
                  <ProgressBar value={progress} height={3} />
                  <span className="course-card__continue">
                    {progress > 0 ? `Continue module ${(currentModule > -1 ? currentModule : 0) + 1}` : 'Start Course →'}
                  </span>
                </div>
              </Link>

              {/* Context menu */}
              <div className="course-card__menu-wrap">
                <button
                  className="course-card__menu-btn"
                  onClick={(e) => { e.preventDefault(); setMenuOpen(menuOpen === course.id ? null : course.id); }}
                  aria-label="Course options"
                >
                  <MoreVertical size={16} />
                </button>
                {menuOpen === course.id && (
                  <motion.div
                    className="course-card__dropdown"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <button onClick={() => archiveCourse(course.id)}>
                      <Archive size={14} /> Archive Course
                    </button>
                    <button onClick={() => { addToast({ type: 'success', title: 'Progress reset' }); setMenuOpen(null); }}>
                      <RotateCcw size={14} /> Reset Progress
                    </button>
                    <button onClick={() => { addToast({ type: 'info', title: 'Share link copied!' }); setMenuOpen(null); }}>
                      <Share2 size={14} /> Share
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Add course card */}
        <Link to="/generate" className="course-card course-card--add">
          <Plus size={32} />
          <span>Generate New Course</span>
        </Link>
      </div>
    </motion.div>
  );
}
