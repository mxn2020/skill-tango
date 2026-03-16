// ═══════════════════════════════════════════════════
// Skill-Tango — Course Syllabus Page
// Accordion modules with lesson lists
// ═══════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle, Play, Lock, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { db } from '../adapters/db';
import { ProgressRing, ProgressBar, Badge, SkeletonLoader, ErrorState } from '../components/ui/SharedUI';
import type { Course } from '../types';
import './CourseSyllabusPage.css';

export function CourseSyllabusPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  async function loadCourse() {
    setLoading(true);
    setError(false);
    try {
      const courses = await db.getAll<Course>('courses');
      const found = courses.find((c) => c.id === courseId);
      if (!found) { setError(true); return; }
      setCourse(found);
      // Calculate progress
      const total = found.modules.reduce((s, m) => s + m.lessons.length, 0);
      const done = found.modules.reduce((s, m) => s + m.lessons.filter((l) => l.status === 'completed').length, 0);
      setProgress(total > 0 ? Math.round((done / total) * 100) : 0);
      // Expand the first in-progress module
      const activeModule = found.modules.find((m) => m.lessons.some((l) => l.status === 'available'));
      if (activeModule) setExpandedModules(new Set([activeModule.id]));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function toggleModule(id: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="syllabus">
        <SkeletonLoader height={240} borderRadius="var(--radius-xl)" />
        {[1, 2, 3, 4].map((i) => <SkeletonLoader key={i} height={64} borderRadius="var(--radius-md)" />)}
      </div>
    );
  }

  if (error || !course) {
    return <div className="syllabus"><ErrorState message="Course not found." onRetry={loadCourse} /></div>;
  }

  const currentLesson = course.modules.flatMap((m) => m.lessons).find((l) => l.status === 'available');

  return (
    <motion.div className="syllabus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      {/* Hero */}
      <div className="syllabus__hero" style={{ background: course.coverGradient }}>
        <div className="syllabus__hero-overlay">
          <div className="syllabus__hero-content">
            <h1>{course.title}</h1>
            <div className="syllabus__hero-meta">
              <span><Clock size={14} /> {course.estimatedHours}h estimated</span>
              <span>•</span>
              <span>{course.modules.reduce((s, m) => s + m.lessons.length, 0)} Lessons</span>
              <span>•</span>
              <Badge variant={course.difficulty === 'beginner' ? 'success' : course.difficulty === 'advanced' ? 'error' : 'warning'} size="sm">
                {course.difficulty}
              </Badge>
            </div>
            <div className="syllabus__hero-progress">
              <ProgressRing value={progress} size={80} color="var(--color-primary)" strokeWidth={5} />
              <div className="syllabus__hero-actions">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Link to={currentLesson ? `/lesson/${currentLesson.id}` : '#'} className="btn btn--primary btn--lg">
                    <Play size={18} />
                    {progress > 0 ? 'Resume Course' : 'Start Course'}
                  </Link>
                </motion.div>
                <Link to="/stats" className="syllabus__stats-link">View Full Stats →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Accordion */}
      <div className="syllabus__modules">
        {course.modules.map((module) => {
          const isExpanded = expandedModules.has(module.id);
          const modCompleted = module.lessons.filter((l) => l.status === 'completed').length;
          const modTotal = module.lessons.length;
          const modProgress = modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0;

          return (
            <div key={module.id} className="syllabus__module">
              <button className="syllabus__module-header" onClick={() => toggleModule(module.id)}>
                <div className="syllabus__module-left">
                  <span className="syllabus__module-number">{module.order + 1}</span>
                  <div className="syllabus__module-info">
                    <span className="syllabus__module-title">{module.title}</span>
                    <span className="syllabus__module-desc">{module.description}</span>
                  </div>
                </div>
                <div className="syllabus__module-right">
                  <span className="syllabus__module-count">{modCompleted}/{modTotal}</span>
                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
                    <ChevronDown size={18} />
                  </motion.div>
                </div>
                <ProgressBar value={modProgress} height={2} />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className="syllabus__lessons"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  >
                    {module.lessons.map((lesson, li) => {
                      const StatusIcon = lesson.status === 'completed' ? CheckCircle : lesson.status === 'available' ? Play : Lock;
                      const isClickable = lesson.status !== 'locked';
                      return (
                        <motion.div
                          key={lesson.id}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: li * 0.08 }}
                        >
                          {isClickable ? (
                            <Link to={`/lesson/${lesson.id}`} className={`syllabus__lesson syllabus__lesson--${lesson.status}`}>
                              <StatusIcon size={18} className="syllabus__lesson-icon" />
                              <span className="syllabus__lesson-title">{lesson.title}</span>
                              <Badge variant={lesson.type === 'reading' ? 'default' : lesson.type === 'quiz' ? 'warning' : lesson.type === 'interactive' ? 'primary' : 'secondary'} size="xs">
                                {lesson.type}
                              </Badge>
                              <span className="syllabus__lesson-time">~{lesson.estimatedMinutes} min</span>
                            </Link>
                          ) : (
                            <div className={`syllabus__lesson syllabus__lesson--locked`}>
                              <StatusIcon size={18} className="syllabus__lesson-icon" />
                              <span className="syllabus__lesson-title">{lesson.title}</span>
                              <Badge variant="default" size="xs">{lesson.type}</Badge>
                              <span className="syllabus__lesson-time">~{lesson.estimatedMinutes} min</span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Floating chat bubble */}
      <motion.button
        className="syllabus__chat-bubble"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        aria-label="Chat with AI tutor"
      >
        <Sparkles size={22} />
      </motion.button>

      {/* Floating resume button */}
      {currentLesson && (
        <motion.div
          className="syllabus__floating-resume"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.5 }}
        >
          <Link to={`/lesson/${currentLesson.id}`} className="btn btn--primary btn--full">
            <Play size={16} />
            Continue: {currentLesson.title}
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
