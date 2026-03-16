// ═══════════════════════════════════════════════════
// Skill-Tango — Lesson Page (Immersion Mode)
// Round 6: Enhanced with confetti, typewriter hints,
// AI grading report card, empathetic feedback
// ═══════════════════════════════════════════════════

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag, CheckCircle, Lightbulb, Trophy, ArrowRight, GripVertical, Sparkles } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { ProgressRing, Badge } from '../components/ui/SharedUI';
import type { QuestionType } from '../types';
import './LessonPage.css';

// ─── Mock Data ────────────────────────────────────

interface MockQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  teachingBlock?: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  hint: string;
  contextualPraise?: string;
}

const MOCK_QUESTIONS: MockQuestion[] = [
  {
    id: 'q1', type: 'multiple-choice',
    teachingBlock: 'A **closure** is a function that has access to variables from its outer (enclosing) scope, even after the outer function has returned. This is possible because JavaScript functions form closures around the data they need to execute.',
    prompt: 'What is the primary purpose of closures in JavaScript?',
    options: ['To make functions run faster', 'To retain access to outer scope variables', 'To prevent memory leaks', 'To enable multi-threading'],
    correctAnswer: 'To retain access to outer scope variables',
    explanation: 'Closures allow inner functions to access variables from their outer scope even after the outer function has completed execution.',
    hint: 'Almost... It looks like you confused the purpose of closures with a performance benefit. Think about what happens to the variables when the outer function finishes executing — they don\'t disappear if an inner function still references them.',
    contextualPraise: 'You nailed the concept of closures. Your understanding of lexical scope is solid.',
  },
  {
    id: 'q2', type: 'fill-blank',
    prompt: 'A closure is created when a function _____ over variables from its outer scope.',
    correctAnswer: 'closes',
    explanation: 'The term "closure" comes from the function "closing over" the variables it needs.',
    hint: 'The answer relates to the name of the concept itself. Think about the etymology of "closure" — what action does the function perform over the outer variables?',
  },
  {
    id: 'q3', type: 'explain',
    prompt: 'Explain in your own words how closures help with data privacy in JavaScript.',
    correctAnswer: 'explanation',
    explanation: 'Closures allow creating private variables that can only be accessed through specific functions.',
    hint: 'Think about how variables inside a function are invisible outside.',
  },
  {
    id: 'q4', type: 'drag-order',
    prompt: 'Order these steps to create a closure:',
    options: ['Define outer function', 'Declare variable in outer scope', 'Define inner function that uses variable', 'Return inner function'],
    correctAnswer: 'Define outer function',
    explanation: 'Creating a closure involves defining an outer function with a local variable, creating an inner function that references it, then returning that inner function.',
    hint: 'Start with the container, then the data, then the function that uses it. Think about nesting.',
  },
  {
    id: 'q5', type: 'multiple-choice',
    prompt: 'Which is a common use case for closures?',
    options: ['DOM manipulation', 'Creating private state', 'File system access', 'Network requests'],
    correctAnswer: 'Creating private state',
    explanation: 'Closures are commonly used to create private state patterns, like module patterns and encapsulated counters.',
    hint: 'Think about encapsulation and hidden variables. Closures are heavily used in the module pattern, where internal state is hidden from the outside world but accessible through returned functions.',
    contextualPraise: 'Excellent! You understand how closures enable the module pattern — a cornerstone of clean JavaScript architecture.',
  },
];

// ─── Confetti Particle Component ──────────────────

function ConfettiParticles() {
  return (
    <div className="lesson__confetti" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="lesson__confetti-particle"
          style={{
            left: `${40 + Math.random() * 20}%`,
            top: `${40 + Math.random() * 20}%`,
            background: [
              'hsl(155, 72%, 40%)',
              'hsl(239, 84%, 67%)',
              'hsl(43, 96%, 56%)',
              'hsl(155, 72%, 50%)',
            ][i % 4],
          }}
          initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          animate={{
            opacity: 0,
            scale: 0.5,
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200 - 60,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ─── Typewriter Text Component ────────────────────

function TypewriterText({ text, speed = 30 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed('');
    const timer = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && <span className="lesson__typewriter-cursor">|</span>}
    </span>
  );
}

// ─── AI Grading Report Card ──────────────────────

interface GradingResult {
  score: number;
  grade: string;
  strengths: string[];
  missingConcepts: string[];
  suggestion: string;
}

function AIGradingCard({ result, onContinue }: { result: GradingResult; onContinue: () => void }) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="lesson__report-card"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="lesson__report-header">
        <div className="lesson__report-score">
          <motion.span
            className="lesson__report-number"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
          >
            {result.score}
          </motion.span>
          <span className="lesson__report-of">/100</span>
        </div>
        <Badge
          variant={result.score >= 80 ? 'success' : result.score >= 60 ? 'warning' : 'error'}
          size="lg"
        >
          {result.grade}
        </Badge>
      </div>

      <AnimatePresence>
        {showContent && (
          <motion.div
            className="lesson__report-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            {/* Strengths */}
            <div className="lesson__report-section lesson__report-section--strengths">
              <h4>✓ Strengths</h4>
              <ul>
                {result.strengths.map((s, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.15 }}
                  >
                    {s}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Areas to Explore */}
            <div className="lesson__report-section lesson__report-section--gaps">
              <h4>△ Areas to Explore</h4>
              <ul>
                {result.missingConcepts.map((m, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.15 }}
                  >
                    {m}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Suggestion */}
            <motion.div
              className="lesson__report-suggestion"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <Sparkles size={16} /> {result.suggestion}
            </motion.div>

            <motion.button
              className="btn btn--primary btn--lg btn--full"
              onClick={onContinue}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              whileTap={{ scale: 0.97 }}
            >
              Continue to Next Question <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── AI Grading Progress ─────────────────────────

function AIGradingProgress({ onComplete }: { onComplete: (result: GradingResult) => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    { label: 'Parsing response...', pct: 30 },
    { label: 'Checking conceptual accuracy...', pct: 60 },
    { label: 'Generating feedback...', pct: 90 },
    { label: 'Complete', pct: 100 },
  ];

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStep(1), 800));
    timers.push(setTimeout(() => setStep(2), 1800));
    timers.push(setTimeout(() => setStep(3), 2700));
    timers.push(setTimeout(() => {
      onComplete({
        score: 85,
        grade: 'A-',
        strengths: [
          'Great understanding of the Virtual DOM reconciliation process.',
          'Clear explanation of how closures create private scope.',
        ],
        missingConcepts: [
          'You didn\'t mention fiber architecture or priority-based scheduling.',
          'Consider exploring the event loop\'s role in closure timing.',
        ],
        suggestion: 'Re-read Module 2, Lesson 3 for a deeper understanding of the reconciliation algorithm.',
      });
    }, 3200));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const current = steps[step];

  return (
    <motion.div
      className="lesson__grading"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <Sparkles size={28} className="lesson__grading-icon" />
      <h3>AI is evaluating your response...</h3>
      <div className="lesson__grading-bar-wrap">
        <motion.div
          className="lesson__grading-bar"
          animate={{ width: `${current.pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <p className="lesson__grading-step">{current.label}</p>
    </motion.div>
  );
}

// ─── Main Lesson Component ────────────────────────

export function LessonPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [textAnswer, setTextAnswer] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'correct' | 'incorrect' | 'grading'>('idle');
  const [attempts, setAttempts] = useState(0);
  const [showExit, setShowExit] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [dragItems, setDragItems] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);

  const question = MOCK_QUESTIONS[currentIdx];
  const total = MOCK_QUESTIONS.length;
  const progressPct = ((currentIdx) / total) * 100;

  // Initialize drag items
  useEffect(() => {
    if (question.type === 'drag-order' && question.options) {
      setDragItems([...question.options].sort(() => Math.random() - 0.5));
    }
  }, [currentIdx, question.type, question.options]);

  const checkAnswer = useCallback(() => {
    // For explain questions, use AI grading
    if (question.type === 'explain') {
      setStatus('grading');
      return;
    }

    setStatus('checking');
    setTimeout(() => {
      let isCorrect = false;
      if (question.type === 'multiple-choice') {
        isCorrect = selectedAnswer === question.correctAnswer;
      } else if (question.type === 'fill-blank') {
        isCorrect = textAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase();
      } else if (question.type === 'drag-order') {
        isCorrect = true; // simplified
      }

      if (isCorrect) {
        setStatus('correct');
        setScore(s => s + 1);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1000);
        addToast({ type: 'success', title: 'Answer correct — streak continues!' });
      } else {
        setStatus('incorrect');
        setAttempts(a => a + 1);
        addToast({ type: 'warning', title: 'Not quite — read the hint and try again.' });
      }
    }, 800);
  }, [question, selectedAnswer, textAnswer, addToast]);

  const handleGradingComplete = useCallback((result: GradingResult) => {
    setGradingResult(result);
    setStatus('correct');
    setScore(s => s + 1);
    addToast({ type: 'achievement', title: `Scored ${result.score}/100 — ${result.grade}` });
  }, [addToast]);

  const nextQuestion = useCallback(() => {
    if (currentIdx >= total - 1) {
      setCompleted(true);
      addToast({ type: 'achievement', title: '🏆 Lesson Complete!', message: `Score: ${score}/${total}` });
      return;
    }
    setCurrentIdx(i => i + 1);
    setSelectedAnswer('');
    setTextAnswer('');
    setStatus('idle');
    setAttempts(0);
    setGradingResult(null);
    const nextQ = MOCK_QUESTIONS[currentIdx + 1];
    if (nextQ.type === 'drag-order' && nextQ.options) {
      setDragItems([...nextQ.options].sort(() => Math.random() - 0.5));
    }
  }, [currentIdx, total, score, addToast]);

  // ─── Completion Screen ──────────────────────────
  if (completed) {
    return (
      <motion.div className="lesson-complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.div className="lesson-complete__card" initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
          <Trophy size={48} className="lesson-complete__trophy" />
          <h2>Lesson Complete! 🎉</h2>
          <ProgressRing value={(score / total) * 100} size={100} color="var(--color-primary)" strokeWidth={6} />
          <div className="lesson-complete__stats">
            <div><strong>Score</strong><span>{score}/{total}</span></div>
            <div><strong>Time</strong><span>~12 min</span></div>
            <div><strong>Streak</strong><span>Day 14 🔥</span></div>
          </div>
          <motion.button className="btn btn--primary btn--lg btn--full" onClick={() => navigate(-1)} whileTap={{ scale: 0.97 }}>
            <ArrowRight size={18} /> Back to Course
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  // ─── Main Lesson View ───────────────────────────
  return (
    <div className="lesson">
      {/* Confetti */}
      {showConfetti && <ConfettiParticles />}

      {/* Top bar */}
      <div className="lesson__topbar">
        <button className="lesson__exit" onClick={() => setShowExit(true)} aria-label="Exit lesson"><X size={20} /></button>
        <div className="lesson__progress-wrap">
          <motion.div className="lesson__progress-bar" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.3 }} />
          <span className="lesson__progress-text">Question {currentIdx + 1} of {total}</span>
        </div>
        <button className="lesson__report" aria-label="Report issue"><Flag size={18} /></button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          className="lesson__content"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
        >
          {/* Teaching block */}
          {question.teachingBlock && (
            <div className="lesson__teaching">
              <p>{question.teachingBlock}</p>
            </div>
          )}

          {/* Question */}
          <h2 className="lesson__question">{question.prompt}</h2>

          {/* ── Multiple Choice ── */}
          {question.type === 'multiple-choice' && question.options && (
            <div className="lesson__mc-grid">
              {question.options.map((opt, i) => {
                const isSelected = selectedAnswer === opt;
                const isCorrectOpt = status === 'correct' && isSelected;
                const isWrong = status === 'incorrect' && isSelected;
                const isDimmed = status === 'incorrect' && !isSelected;
                return (
                  <motion.button
                    key={opt}
                    className={`lesson__mc-option ${isSelected ? 'lesson__mc-option--selected' : ''} ${isCorrectOpt ? 'lesson__mc-option--correct' : ''} ${isWrong ? 'lesson__mc-option--wrong' : ''} ${isDimmed ? 'lesson__mc-option--dimmed' : ''}`}
                    onClick={() => status === 'idle' && setSelectedAnswer(opt)}
                    whileTap={status === 'idle' ? { scale: 0.97 } : {}}
                    animate={isCorrectOpt ? { scale: [1, 1.05, 1] } : isWrong ? { x: [0, -8, 8, -4, 4, 0] } : {}}
                    transition={isWrong ? { duration: 0.4 } : { duration: 0.3 }}
                  >
                    <span className="lesson__mc-letter">{String.fromCharCode(65 + i)}</span>
                    <span>{opt}</span>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* ── Fill Blank ── */}
          {question.type === 'fill-blank' && (
            <input
              className="lesson__fill-input"
              value={textAnswer}
              onChange={e => setTextAnswer(e.target.value)}
              placeholder="Type your answer..."
              autoFocus
              disabled={status !== 'idle'}
            />
          )}

          {/* ── Explain It ── */}
          {question.type === 'explain' && status !== 'grading' && !gradingResult && (
            <div className="lesson__explain-wrap">
              <textarea
                className="lesson__explain-textarea"
                value={textAnswer}
                onChange={e => setTextAnswer(e.target.value)}
                placeholder="Explain in your own words..."
                rows={5}
                disabled={status !== 'idle'}
              />
              <span className="lesson__char-count">{textAnswer.length}/500</span>
            </div>
          )}

          {/* ── Drag Order ── */}
          {question.type === 'drag-order' && (
            <div className="lesson__drag-list">
              {dragItems.map((item) => (
                <div key={item} className="lesson__drag-item">
                  <GripVertical size={16} className="lesson__drag-handle" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── AI Grading Progress ── */}
          {status === 'grading' && (
            <AIGradingProgress onComplete={handleGradingComplete} />
          )}

          {/* ── AI Grading Report Card ── */}
          {gradingResult && (
            <AIGradingCard result={gradingResult} onContinue={nextQuestion} />
          )}

          {/* ── Feedback (non-explain questions) ── */}
          {!gradingResult && (
            <AnimatePresence>
              {status === 'correct' && (
                <motion.div
                  className="lesson__feedback lesson__feedback--correct"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <CheckCircle size={32} className="lesson__feedback-icon-check" />
                  <div>
                    <strong>Spot on! 🎉</strong>
                    <p>{question.contextualPraise || question.explanation}</p>
                  </div>
                </motion.div>
              )}
              {status === 'incorrect' && (
                <motion.div
                  className="lesson__feedback lesson__feedback--hint"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <Lightbulb size={24} className="lesson__hint-icon" />
                  <div>
                    <strong>Almost...</strong>
                    <p className="lesson__hint-typewriter">
                      <TypewriterText text={question.hint} speed={25} />
                    </p>
                    {attempts >= 2 && (
                      <motion.p
                        className="lesson__feedback-answer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <strong>Correct answer:</strong> {question.correctAnswer}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* ── Action Buttons ── */}
          <div className="lesson__actions">
            {status === 'idle' && (selectedAnswer || textAnswer.length > 0) && (
              <motion.button
                className="btn btn--primary btn--lg btn--full"
                onClick={checkAnswer}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileTap={{ scale: 0.97 }}
              >
                Check Answer
              </motion.button>
            )}
            {status === 'checking' && (
              <div className="btn btn--primary btn--lg btn--full" style={{ opacity: 0.6 }}>Checking...</div>
            )}
            {status === 'correct' && !gradingResult && (
              <motion.button
                className="btn btn--primary btn--lg btn--full"
                onClick={nextQuestion}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileTap={{ scale: 0.97 }}
              >
                Continue <ArrowRight size={16} />
              </motion.button>
            )}
            {status === 'incorrect' && attempts < 2 && (
              <motion.button
                className="btn btn--secondary btn--lg btn--full"
                onClick={() => { setStatus('idle'); setSelectedAnswer(''); setTextAnswer(''); }}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileTap={{ scale: 0.97 }}
              >
                Try Again
              </motion.button>
            )}
            {status === 'incorrect' && attempts >= 2 && (
              <motion.button
                className="btn btn--primary btn--lg btn--full"
                onClick={nextQuestion}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileTap={{ scale: 0.97 }}
              >
                Continue <ArrowRight size={16} />
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Exit modal */}
      <AnimatePresence>
        {showExit && (
          <motion.div className="lesson__exit-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="lesson__exit-card" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <h3>Leave this lesson?</h3>
              <p>Progress on this question won't be saved.</p>
              <div className="lesson__exit-actions">
                <button className="btn btn--primary" onClick={() => setShowExit(false)}>Stay</button>
                <button className="btn btn--ghost" onClick={() => navigate(-1)}>Leave</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
