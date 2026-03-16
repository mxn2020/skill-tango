// ═══════════════════════════════════════════════════
// Skill-Tango — Generate Course Page
// AI-powered course generation with eager loading
// ═══════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle, Zap, BookOpen, Guitar, Clock } from 'lucide-react';
import { db } from '../adapters/db';
import { useToast } from '../components/ui/Toast';
import { Badge } from '../components/ui/SharedUI';
import './GenerateCoursePage.css';

const PRESETS = [
  { title: 'Introduction to Rust', difficulty: 'beginner', time: '~3h', gradient: 'linear-gradient(135deg, hsl(18, 65%, 25%) 0%, hsl(25, 50%, 18%) 100%)', icon: Zap },
  { title: 'Mastering Negotiation', difficulty: 'intermediate', time: '~5h', gradient: 'linear-gradient(135deg, hsl(43, 60%, 28%) 0%, hsl(30, 40%, 18%) 100%)', icon: BookOpen },
  { title: 'World War II History', difficulty: 'beginner', time: '~4h', gradient: 'linear-gradient(135deg, hsl(35, 30%, 22%) 0%, hsl(25, 25%, 15%) 100%)', icon: BookOpen },
  { title: 'Beginner Guitar Chords', difficulty: 'beginner', time: '~2h', gradient: 'linear-gradient(135deg, hsl(210, 50%, 25%) 0%, hsl(30, 45%, 20%) 100%)', icon: Guitar },
];

const GENERATION_STEPS = [
  'Analyzing topic semantics...',
  'Structuring pedagogical flow...',
  'Generating core modules...',
  'Calibrating spaced repetition hooks...',
  'Architecting assessment framework...',
];

const PLACEHOLDER_ROTATIONS = [
  'I want to learn conversational Spanish...',
  'Teach me how to build a Next.js app...',
  'Explain Quantum Physics like I\'m 15...',
  'Master TypeScript generics from scratch...',
  'Learn photography composition fundamentals...',
];

export function GenerateCoursePage() {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [placeholder, setPlaceholder] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [generationCount, setGenerationCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Load generation count
  useEffect(() => {
    db.getAppState<number>('courseGenerationCount').then((c) => setGenerationCount(c || 0));
  }, []);

  // Typewriter placeholder
  useEffect(() => {
    if (isGenerating) return;
    const target = PLACEHOLDER_ROTATIONS[placeholderIdx % PLACEHOLDER_ROTATIONS.length];
    if (charIdx < target.length) {
      const timer = setTimeout(() => {
        setPlaceholder(target.slice(0, charIdx + 1));
        setCharIdx(charIdx + 1);
      }, 40);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setCharIdx(0);
        setPlaceholderIdx(placeholderIdx + 1);
        setPlaceholder('');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [charIdx, placeholderIdx, isGenerating]);

  async function handleGenerate(topicText: string) {
    if (!topicText.trim()) return;
    setIsGenerating(true);
    setCurrentStep(0);

    // Animate through steps
    for (let i = 0; i < GENERATION_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 800));
      setCurrentStep(i + 1);
    }

    // Actually generate
    const course = await db.generateCourse(topicText);
    await db.setAppState('courseGenerationCount', generationCount + 1);

    addToast({ type: 'success', title: 'Course curriculum successfully architected!' });
    navigate(`/course/${course.id}`);
  }

  function handlePresetClick(presetTitle: string) {
    setTopic(presetTitle);
    handleGenerate(presetTitle);
  }

  return (
    <motion.div
      className="generate-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <AnimatePresence mode="wait">
        {!isGenerating ? (
          <motion.div
            key="input"
            className="generate-page__input-section"
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="generate-page__title">What do you want to learn?</h1>
            <p className="generate-page__subtitle">
              Describe any topic and our AI will architect a complete curriculum.
            </p>

            {generationCount >= 2 && (
              <div className="generate-page__limit-badge">
                <Badge variant="warning" size="md">
                  {generationCount} of 2 free generations used
                </Badge>
              </div>
            )}

            <div className="generate-page__input-wrap">
              <textarea
                ref={textareaRef}
                className="generate-page__textarea"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={placeholder + '|'}
                rows={3}
              />
              <motion.button
                className="btn btn--primary btn--lg generate-page__submit"
                disabled={!topic.trim()}
                onClick={() => handleGenerate(topic)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <Sparkles size={18} />
                Build My Course
              </motion.button>
            </div>

            <div className="generate-page__presets">
              <h3 className="generate-page__presets-title">Or try a curated preset</h3>
              <div className="generate-page__preset-grid">
                {PRESETS.map((preset) => (
                  <motion.button
                    key={preset.title}
                    className="generate-page__preset-card"
                    style={{ background: preset.gradient }}
                    onClick={() => handlePresetClick(preset.title)}
                    whileHover={{ y: -4, boxShadow: 'var(--shadow-md)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="generate-page__preset-title">{preset.title}</span>
                    <div className="generate-page__preset-meta">
                      <Badge variant={preset.difficulty === 'beginner' ? 'success' : 'warning'} size="xs">
                        {preset.difficulty}
                      </Badge>
                      <span className="generate-page__preset-time">
                        <Clock size={12} /> {preset.time}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="generating"
            className="generate-page__generation"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Sparkles size={40} className="generate-page__gen-icon" />
            <h2 className="generate-page__gen-title">Architecting your curriculum...</h2>
            <div className="generate-page__steps">
              {GENERATION_STEPS.map((step, i) => (
                <motion.div
                  key={step}
                  className={`generate-page__step ${i < currentStep ? 'generate-page__step--done' : i === currentStep ? 'generate-page__step--active' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15, type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <div className="generate-page__step-icon">
                    {i < currentStep ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                        <CheckCircle size={18} />
                      </motion.div>
                    ) : (
                      <div className="generate-page__step-dot" />
                    )}
                  </div>
                  <span>{step}</span>
                </motion.div>
              ))}
            </div>
            <motion.div
              className="generate-page__gen-progress"
              initial={{ width: '0%' }}
              animate={{ width: `${(currentStep / GENERATION_STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
