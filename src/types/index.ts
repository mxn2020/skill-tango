// ═══════════════════════════════════════════════════
// Skill-Tango — Core Type Definitions
// ═══════════════════════════════════════════════════

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'enterprise';
  role: 'Owner' | 'Learner';
  preferences: UserPreferences;
  createdAt: string;
  xp: number;
  level: number;
}

export interface UserPreferences {
  coachingStyle: 'direct' | 'supportive' | 'balanced';
  dailyGoalMinutes: number;
  enableSounds: boolean;
  theme: 'dark' | 'light';
  learningGoal?: 'build' | 'exam' | 'daily';
  interests: string[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  coverGradient: string;
  estimatedHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  modules: Module[];
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  type: 'reading' | 'quiz' | 'interactive' | 'explain';
  status: 'locked' | 'available' | 'completed';
  estimatedMinutes: number;
  order: number;
  content?: LessonContent;
}

export interface LessonContent {
  teachingBlock?: string;
  questions: Question[];
}

export type QuestionType = 'multiple-choice' | 'fill-blank' | 'explain' | 'drag-order' | 'flashcard';

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  hint?: string;
  codeBlock?: string;
}

export interface Progress {
  id: string;
  userId: string;
  courseId: string;
  moduleId?: string;
  lessonId: string;
  score: number;
  completedAt: string;
  timeSpentMinutes: number;
}

export interface MemoryItem {
  id: string;
  conceptName: string;
  courseId: string;
  lessonId: string;
  memoryStrength: number; // 0-100
  lastReviewed: string;
  nextReviewAt: string;
  easeFactor: number; // SM-2 parameter
  interval: number;   // days
  repetitions: number;
}

export interface Streak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  totalSessions: number;
  activeDays: ActivityDay[];
}

export interface ActivityDay {
  date: string;
  sessionsCompleted: number;
  minutesSpent: number;
  lessonsCompleted: number;
  xpEarned: number;
}

export interface Notification {
  id: string;
  type: 'streak_warning' | 'course_update' | 'ai_insight' | 'achievement' | 'review_reminder';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  icon?: string;
}

export interface SystemPrompt {
  id: string;
  promptId: string;
  description: string;
  version: string;
  status: 'active' | 'draft' | 'disabled';
  template: string;
  expectedSchema: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  interests: string[];
  skillLevels: Record<string, number>;
  learningGoal: 'build' | 'exam' | 'daily' | null;
  dailyGoalMinutes: number;
}

export interface AIBriefing {
  greeting: string;
  insight: string;
  suggestion: string;
  encouragement: string;
}

export interface LifePulseData {
  stressLevel: number;    // 0-100
  sleepQuality: number;   // 0-100
  focusScore: number;     // 0-100
  lastSynced: string;
  status: 'optimal' | 'elevated' | 'overloaded';
}

export interface DiagnosticResult {
  questionId: string;
  isCorrect: boolean;
  attempts: number;
  score: number;
  grade: string;
  strengths: string[];
  missingConcepts: string[];
  suggestion: string;
  timeSpent: number;
}

export interface InferenceResult {
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  costUsd: number;
  output: unknown;
}

export interface Toast {
  id: string;
  type: 'success' | 'warning' | 'error' | 'achievement' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface CommandPaletteItem {
  id: string;
  type: 'course' | 'lesson' | 'action' | 'admin' | 'recent';
  title: string;
  subtitle?: string;
  icon?: string;
  action: () => void;
}
