// ═══════════════════════════════════════════════════
// Skill-Tango — Onboarding Wizard
// 4-step cinematic onboarding flow
// ═══════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Search, ChevronRight, ChevronLeft, Check,
  Code, Languages, Palette, Microscope, Music, Camera,
  Globe, Calculator, BookOpen, Brain, Dumbbell, Lightbulb,
  Rocket, GraduationCap, Clock,
} from 'lucide-react';
import { db } from '../adapters/db';
import { useAuth } from '../adapters/auth';
import { useToast } from '../components/ui/Toast';
import type { OnboardingState } from '../types';
import './OnboardingPage.css';

// ─── Step Data ────────────────────────────────────

const INTERESTS = [
  { id: 'programming', label: 'Programming', icon: Code, color: 'hsl(155, 72%, 40%)' },
  { id: 'languages', label: 'Languages', icon: Languages, color: 'hsl(239, 84%, 67%)' },
  { id: 'design', label: 'Design', icon: Palette, color: 'hsl(320, 65%, 52%)' },
  { id: 'science', label: 'Science', icon: Microscope, color: 'hsl(45, 90%, 55%)' },
  { id: 'music', label: 'Music', icon: Music, color: 'hsl(280, 68%, 58%)' },
  { id: 'photography', label: 'Photography', icon: Camera, color: 'hsl(195, 85%, 50%)' },
  { id: 'history', label: 'History', icon: Globe, color: 'hsl(25, 75%, 55%)' },
  { id: 'math', label: 'Mathematics', icon: Calculator, color: 'hsl(200, 70%, 50%)' },
  { id: 'writing', label: 'Writing', icon: BookOpen, color: 'hsl(155, 50%, 45%)' },
  { id: 'psychology', label: 'Psychology', icon: Brain, color: 'hsl(350, 65%, 55%)' },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell, color: 'hsl(12, 80%, 52%)' },
  { id: 'philosophy', label: 'Philosophy', icon: Lightbulb, color: 'hsl(43, 96%, 56%)' },
];

const SKILL_LABELS = [
  { level: 1, label: '🌱 Beginner', color: 'var(--color-success)' },
  { level: 2, label: '📘 Learning', color: 'var(--color-info)' },
  { level: 3, label: '⚡ Intermediate', color: 'var(--color-warning)' },
  { level: 4, label: '🔥 Advanced', color: 'hsl(12, 80%, 52%)' },
  { level: 5, label: '🏆 Expert', color: 'var(--color-accent)' },
];

const GOALS = [
  {
    id: 'build',
    title: 'Build Something',
    description: 'Project-based learning — build real things as you learn.',
    icon: Rocket,
    gradient: 'linear-gradient(135deg, hsl(155, 60%, 22%) 0%, hsl(155, 40%, 12%) 100%)',
  },
  {
    id: 'exam',
    title: 'Pass an Exam',
    description: 'Certification-focused path with structured study plans.',
    icon: GraduationCap,
    gradient: 'linear-gradient(135deg, hsl(239, 60%, 25%) 0%, hsl(239, 40%, 14%) 100%)',
  },
  {
    id: 'daily',
    title: 'Level Up Daily',
    description: 'Micro-learning streaks — a little every day adds up.',
    icon: Clock,
    gradient: 'linear-gradient(135deg, hsl(43, 70%, 28%) 0%, hsl(43, 50%, 14%) 100%)',
  },
];

const DAILY_PRESETS = [5, 10, 15, 30, 45, 60, 90];

const SLIDE_VARIANTS = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

// ─── Component ────────────────────────────────────

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [skillLevels, setSkillLevels] = useState<Record<string, number>>({});
  const [learningGoal, setLearningGoal] = useState<'build' | 'exam' | 'daily' | null>(null);
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [finishing, setFinishing] = useState(false);

  const totalSteps = 4;

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }, []);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev; // max 5
      // Initialize skill level
      if (!skillLevels[id]) setSkillLevels((sl) => ({ ...sl, [id]: 2 }));
      return [...prev, id];
    });
  };

  const handleFinish = async () => {
    setFinishing(true);

    const onboarding: OnboardingState = {
      completed: true,
      currentStep: totalSteps,
      interests: selectedInterests,
      skillLevels,
      learningGoal,
      dailyGoalMinutes: dailyMinutes,
    };

    await db.setAppState('onboarding', onboarding);

    // Update user preferences
    if (user) {
      updateUser({
        preferences: {
          ...user.preferences,
          dailyGoalMinutes: dailyMinutes,
          learningGoal: learningGoal || 'daily',
          interests: selectedInterests,
        },
      });
    }

    addToast({ type: 'achievement', title: '🎉 Welcome to Skill-Tango!', message: 'Your personalized learning path is ready.' });
    navigate('/dashboard');
  };

  const canProceed = (s: number) => {
    switch (s) {
      case 0: return true; // intro
      case 1: return selectedInterests.length >= 1;
      case 2: return selectedInterests.every((id) => skillLevels[id] !== undefined);
      case 3: return learningGoal !== null;
      default: return false;
    }
  };

  const filteredInterests = search.trim()
    ? INTERESTS.filter((i) => i.label.toLowerCase().includes(search.toLowerCase()))
    : INTERESTS;

  return (
    <div className="onboarding">
      {/* Background particles */}
      <div className="onboarding__bg">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="onboarding__particle"
            style={{
              left: `${10 + (i % 4) * 25}%`,
              top: `${15 + Math.floor(i / 4) * 40}%`,
            }}
            animate={{
              opacity: [0.05, 0.15, 0.05],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 5 + i * 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.6,
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="onboarding__progress">
        <motion.div
          className="onboarding__progress-fill"
          animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
        <div className="onboarding__progress-dots">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.div
              key={i}
              className={`onboarding__dot ${i <= step ? 'onboarding__dot--active' : ''} ${i < step ? 'onboarding__dot--done' : ''}`}
              animate={i === step ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {i < step ? <Check size={12} /> : <span>{i + 1}</span>}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="onboarding__stage">
        <AnimatePresence mode="wait" custom={direction}>
          {/* ─── Step 0: The Why ─── */}
          {step === 0 && (
            <motion.div
              key="step0"
              className="onboarding__step onboarding__step-intro"
              custom={direction}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <motion.div
                className="onboarding__intro-icon"
                animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles size={56} />
              </motion.div>
              <h1>What do you want to master?</h1>
              <p className="onboarding__intro-sub">
                Tell us your interests and we'll craft a personalized learning journey
                powered by AI — adapted to your pace, your style, your goals.
              </p>
              <motion.button
                className="btn btn--primary btn--lg"
                onClick={goNext}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Let's Begin <ChevronRight size={18} />
              </motion.button>
            </motion.div>
          )}

          {/* ─── Step 1: Subject Picker ─── */}
          {step === 1 && (
            <motion.div
              key="step1"
              className="onboarding__step onboarding__step-interests"
              custom={direction}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <h2>Choose your interests</h2>
              <p className="onboarding__step-desc">
                Pick 1–5 subjects you're curious about. We'll personalize everything around these.
              </p>

              <div className="onboarding__search-wrap">
                <Search size={18} className="onboarding__search-icon" />
                <input
                  className="onboarding__search"
                  type="text"
                  placeholder="Search interests..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="onboarding__interests-grid">
                {filteredInterests.map((interest, i) => {
                  const isSelected = selectedInterests.includes(interest.id);
                  return (
                    <motion.button
                      key={interest.id}
                      className={`onboarding__interest-card ${isSelected ? 'onboarding__interest-card--selected' : ''}`}
                      onClick={() => toggleInterest(interest.id)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <div className="onboarding__interest-icon" style={{ color: interest.color }}>
                        <interest.icon size={24} />
                      </div>
                      <span>{interest.label}</span>
                      {isSelected && (
                        <motion.div
                          className="onboarding__interest-check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                          <Check size={14} />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <p className="onboarding__interest-count">
                {selectedInterests.length} of 5 selected
              </p>
            </motion.div>
          )}

          {/* ─── Step 2: Skill Assessment ─── */}
          {step === 2 && (
            <motion.div
              key="step2"
              className="onboarding__step onboarding__step-skills"
              custom={direction}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <h2>Rate your current level</h2>
              <p className="onboarding__step-desc">
                Be honest — overestimating delays your progress. We use this to calibrate your path.
              </p>

              <div className="onboarding__skill-list">
                {selectedInterests.map((interestId, i) => {
                  const interest = INTERESTS.find((x) => x.id === interestId)!;
                  const level = skillLevels[interestId] || 2;
                  const labelData = SKILL_LABELS[level - 1];

                  return (
                    <motion.div
                      key={interestId}
                      className="onboarding__skill-row"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="onboarding__skill-header">
                        <div className="onboarding__skill-info">
                          <interest.icon size={18} style={{ color: interest.color }} />
                          <span>{interest.label}</span>
                        </div>
                        <span className="onboarding__skill-badge" style={{ color: labelData.color }}>
                          {labelData.label}
                        </span>
                      </div>
                      <div className="onboarding__slider-wrap">
                        <input
                          type="range"
                          min={1}
                          max={5}
                          value={level}
                          className="onboarding__skill-slider"
                          onChange={(e) =>
                            setSkillLevels((prev) => ({
                              ...prev,
                              [interestId]: parseInt(e.target.value),
                            }))
                          }
                          style={{
                            background: `linear-gradient(to right, ${labelData.color} ${((level - 1) / 4) * 100}%, var(--bg-elevated-3) ${((level - 1) / 4) * 100}%)`,
                          }}
                        />
                        <div className="onboarding__slider-marks">
                          {SKILL_LABELS.map((l) => (
                            <span key={l.level} className={l.level === level ? 'active' : ''}>
                              {l.level}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ─── Step 3: Goal Setting ─── */}
          {step === 3 && (
            <motion.div
              key="step3"
              className="onboarding__step onboarding__step-goals"
              custom={direction}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <h2>What's your learning style?</h2>
              <p className="onboarding__step-desc">
                This shapes how we structure your courses and daily practice.
              </p>

              <div className="onboarding__goals-grid">
                {GOALS.map((goal, i) => {
                  const isSelected = learningGoal === goal.id;
                  return (
                    <motion.button
                      key={goal.id}
                      className={`onboarding__goal-card ${isSelected ? 'onboarding__goal-card--selected' : ''}`}
                      style={{ background: goal.gradient }}
                      onClick={() => setLearningGoal(goal.id as 'build' | 'exam' | 'daily')}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <goal.icon size={32} className="onboarding__goal-icon" />
                      <h3>{goal.title}</h3>
                      <p>{goal.description}</p>
                      {isSelected && (
                        <motion.div
                          className="onboarding__goal-check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                          <Check size={16} />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Daily minutes */}
              <div className="onboarding__daily">
                <h3>How many minutes per day?</h3>
                <div className="onboarding__daily-presets">
                  {DAILY_PRESETS.map((m) => (
                    <button
                      key={m}
                      className={`onboarding__daily-chip ${dailyMinutes === m ? 'onboarding__daily-chip--active' : ''}`}
                      onClick={() => setDailyMinutes(m)}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
                <div className="onboarding__daily-visual">
                  <motion.div
                    className="onboarding__daily-ring"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                  >
                    <svg viewBox="0 0 120 120" width={120} height={120}>
                      <circle cx={60} cy={60} r={52} fill="none" stroke="var(--bg-elevated-3)" strokeWidth={6} />
                      <motion.circle
                        cx={60} cy={60} r={52}
                        fill="none" stroke="var(--color-primary)" strokeWidth={6}
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 52}
                        animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - dailyMinutes / 120) }}
                        transition={{ duration: 0.4 }}
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                      />
                    </svg>
                    <span className="onboarding__daily-ring-value">{dailyMinutes}<small>min</small></span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation footer */}
      <div className="onboarding__footer">
        {step > 0 && (
          <motion.button
            className="btn btn--ghost"
            onClick={goPrev}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ChevronLeft size={18} /> Back
          </motion.button>
        )}
        <div className="onboarding__footer-spacer" />
        {step < totalSteps - 1 ? (
          <motion.button
            className="btn btn--primary btn--lg"
            onClick={goNext}
            disabled={!canProceed(step)}
            whileHover={canProceed(step) ? { scale: 1.02 } : {}}
            whileTap={canProceed(step) ? { scale: 0.97 } : {}}
          >
            Continue <ChevronRight size={18} />
          </motion.button>
        ) : (
          <motion.button
            className="btn btn--primary btn--lg"
            onClick={handleFinish}
            disabled={!canProceed(step) || finishing}
            whileHover={canProceed(step) ? { scale: 1.02 } : {}}
            whileTap={canProceed(step) ? { scale: 0.97 } : {}}
          >
            {finishing ? (
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.span>
            ) : (
              <>
                <Sparkles size={18} /> Begin My Journey
              </>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
}
