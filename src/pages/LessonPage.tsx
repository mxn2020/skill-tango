// ═══════════════════════════════════════════════════
// Skill-Tango — Lesson Page (Immersion Mode)
// Full-screen interactive learning
// ═══════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag, CheckCircle, Lightbulb, Trophy, ArrowRight, GripVertical } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { ProgressRing, Badge } from '../components/ui/SharedUI';
import type { QuestionType } from '../types';
import './LessonPage.css';

interface MockQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  teachingBlock?: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  hint: string;
}

const MOCK_QUESTIONS: MockQuestion[] = [
  {
    id: 'q1', type: 'multiple-choice',
    teachingBlock: 'A **closure** is a function that has access to variables from its outer (enclosing) scope, even after the outer function has returned. This is possible because JavaScript functions form closures around the data they need to execute.',
    prompt: 'What is the primary purpose of closures in JavaScript?',
    options: ['To make functions run faster', 'To retain access to outer scope variables', 'To prevent memory leaks', 'To enable multi-threading'],
    correctAnswer: 'To retain access to outer scope variables',
    explanation: 'Closures allow inner functions to access variables from their outer scope even after the outer function has completed execution.',
    hint: 'Think about what happens to the variables when the outer function finishes.',
  },
  {
    id: 'q2', type: 'fill-blank',
    prompt: 'A closure is created when a function _____ over variables from its outer scope.',
    correctAnswer: 'closes',
    explanation: 'The term "closure" comes from the function "closing over" the variables it needs.',
    hint: 'The answer relates to the name of the concept itself.',
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
    hint: 'Start with the container, then the data, then the function that uses it.',
  },
  {
    id: 'q5', type: 'multiple-choice',
    prompt: 'Which is a common use case for closures?',
    options: ['DOM manipulation', 'Creating private state', 'File system access', 'Network requests'],
    correctAnswer: 'Creating private state',
    explanation: 'Closures are commonly used to create private state patterns, like module patterns and encapsulated counters.',
    hint: 'Think about encapsulation and hidden variables.',
  },
];

export function LessonPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [textAnswer, setTextAnswer] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'correct' | 'incorrect'>('idle');
  const [attempts, setAttempts] = useState(0);
  const [showExit, setShowExit] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [dragItems, setDragItems] = useState<string[]>([]);

  const question = MOCK_QUESTIONS[currentIdx];
  const total = MOCK_QUESTIONS.length;
  const progressPct = ((currentIdx) / total) * 100;

  // Initialize drag items when switching to a drag question
  useState(() => {
    if (question.type === 'drag-order' && question.options) {
      setDragItems([...question.options].sort(() => Math.random() - 0.5));
    }
  });

  const checkAnswer = useCallback(() => {
    setStatus('checking');
    setTimeout(() => {
      let isCorrect = false;
      if (question.type === 'multiple-choice') {
        isCorrect = selectedAnswer === question.correctAnswer;
      } else if (question.type === 'fill-blank') {
        isCorrect = textAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase();
      } else if (question.type === 'explain') {
        isCorrect = textAnswer.length > 20; // simplified check
      } else if (question.type === 'drag-order') {
        isCorrect = true; // simplified
      }

      if (isCorrect) {
        setStatus('correct');
        setScore(s => s + 1);
        addToast({ type: 'success', title: 'Answer correct — streak continues!' });
      } else {
        setStatus('incorrect');
        setAttempts(a => a + 1);
        addToast({ type: 'warning', title: 'Not quite — read the hint and try again.' });
      }
    }, 800);
  }, [question, selectedAnswer, textAnswer, addToast]);

  const nextQuestion = useCallback(() => {
    if (currentIdx >= total - 1) {
      setCompleted(true);
      addToast({ type: 'achievement', title: '🏆 Lesson Complete!', message: `Score: ${score + (status === 'correct' ? 0 : 0)}/${total}` });
      return;
    }
    setCurrentIdx(i => i + 1);
    setSelectedAnswer('');
    setTextAnswer('');
    setStatus('idle');
    setAttempts(0);
    const nextQ = MOCK_QUESTIONS[currentIdx + 1];
    if (nextQ.type === 'drag-order' && nextQ.options) {
      setDragItems([...nextQ.options].sort(() => Math.random() - 0.5));
    }
  }, [currentIdx, total, score, status, addToast]);

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

  return (
    <div className="lesson">
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

          {/* Interaction Area */}
          {question.type === 'multiple-choice' && question.options && (
            <div className="lesson__mc-grid">
              {question.options.map((opt, i) => (
                <motion.button
                  key={opt}
                  className={`lesson__mc-option ${selectedAnswer === opt ? 'lesson__mc-option--selected' : ''} ${status === 'correct' && selectedAnswer === opt ? 'lesson__mc-option--correct' : ''} ${status === 'incorrect' && selectedAnswer === opt ? 'lesson__mc-option--wrong' : ''}`}
                  onClick={() => status === 'idle' && setSelectedAnswer(opt)}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="lesson__mc-letter">{String.fromCharCode(65 + i)}</span>
                  <span>{opt}</span>
                </motion.button>
              ))}
            </div>
          )}

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

          {question.type === 'explain' && (
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

          {/* Feedback */}
          <AnimatePresence>
            {status === 'correct' && (
              <motion.div className="lesson__feedback lesson__feedback--correct" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} transition={{ type: 'spring' }}>
                <CheckCircle size={24} />
                <div>
                  <strong>Spot on! 🎉</strong>
                  <p>{question.explanation}</p>
                </div>
              </motion.div>
            )}
            {status === 'incorrect' && (
              <motion.div className="lesson__feedback lesson__feedback--hint" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} transition={{ type: 'spring' }}>
                <Lightbulb size={24} />
                <div>
                  <strong>Almost...</strong>
                  <p>{question.hint}</p>
                  {attempts >= 2 && <p className="lesson__feedback-answer"><strong>Correct answer:</strong> {question.correctAnswer}</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="lesson__actions">
            {status === 'idle' && (selectedAnswer || textAnswer.length > 0) && (
              <motion.button className="btn btn--primary btn--lg btn--full" onClick={checkAnswer} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} whileTap={{ scale: 0.97 }}>
                {status === 'checking' ? 'Checking...' : 'Check Answer'}
              </motion.button>
            )}
            {status === 'checking' && (
              <div className="btn btn--primary btn--lg btn--full" style={{ opacity: 0.6 }}>Checking...</div>
            )}
            {status === 'correct' && (
              <motion.button className="btn btn--primary btn--lg btn--full" onClick={nextQuestion} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} whileTap={{ scale: 0.97 }}>
                Continue <ArrowRight size={16} />
              </motion.button>
            )}
            {status === 'incorrect' && attempts < 2 && (
              <motion.button className="btn btn--secondary btn--lg btn--full" onClick={() => { setStatus('idle'); setSelectedAnswer(''); setTextAnswer(''); }} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} whileTap={{ scale: 0.97 }}>
                Try Again
              </motion.button>
            )}
            {status === 'incorrect' && attempts >= 2 && (
              <motion.button className="btn btn--primary btn--lg btn--full" onClick={nextQuestion} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} whileTap={{ scale: 0.97 }}>
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
