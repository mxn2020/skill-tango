// ═══════════════════════════════════════════════════
// Skill-Tango — DB Adapter
// Fully abstracted persistence over localStorage
// Swap-ready for Convex/Supabase
// ═══════════════════════════════════════════════════

import type { Course, Module, Lesson, Progress, Streak, ActivityDay, Notification, SystemPrompt, OnboardingState, MemoryItem, LifePulseData, Question } from '../types';
import { logger } from './logger';

const DB_PREFIX = 'skill-tango-db-';
const SEEDED_KEY = 'skill-tango-seeded';

// In-memory cache
const cache: Record<string, unknown[]> = {};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function delay(min = 50, max = 200): Promise<void> {
  return new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));
}

function readCollection<T>(collection: string): T[] {
  if (cache[collection]) return cache[collection] as T[];
  try {
    const raw = localStorage.getItem(DB_PREFIX + collection);
    const data = raw ? JSON.parse(raw) : [];
    cache[collection] = data;
    return data as T[];
  } catch {
    logger.error('DB', `Failed to read collection: ${collection}`);
    return [];
  }
}

function writeCollection<T>(collection: string, data: T[]): void {
  cache[collection] = data as unknown[];
  localStorage.setItem(DB_PREFIX + collection, JSON.stringify(data));
}

// ─── Seed Data Generators ────────────────────────

function generateCoverGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 40 + Math.abs((hash >> 8) % 40)) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 60%, 25%) 0%, hsl(${h2}, 70%, 18%) 100%)`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function generateSeedCourses(): Course[] {
  const makeQuestions = (topic: string): Question[] => [
    {
      id: generateId(),
      type: 'multiple-choice',
      prompt: `What is the primary purpose of ${topic}?`,
      options: ['Data persistence', 'Type safety', 'Memory management', 'Network requests'],
      correctAnswer: 'Type safety',
      explanation: `${topic} primarily provides type safety, catching errors at compile time rather than runtime.`,
      hint: 'Think about what happens before your code runs.',
    },
    {
      id: generateId(),
      type: 'fill-blank',
      prompt: `Complete: In ${topic}, we use _____ to define reusable type patterns.`,
      correctAnswer: 'generics',
      explanation: 'Generics allow you to create flexible, reusable components that work with multiple types.',
    },
    {
      id: generateId(),
      type: 'explain',
      prompt: `Explain in your own words how ${topic} improves code maintainability.`,
      correctAnswer: 'explanation',
      explanation: 'A good answer covers type checking, IDE support, refactoring safety, and documentation.',
    },
    {
      id: generateId(),
      type: 'drag-order',
      prompt: 'Order these steps for setting up a TypeScript project:',
      options: ['Install TypeScript', 'Create tsconfig.json', 'Write .ts files', 'Compile with tsc'],
      correctAnswer: ['Install TypeScript', 'Create tsconfig.json', 'Write .ts files', 'Compile with tsc'],
      explanation: 'The correct order ensures proper configuration before compilation.',
    },
    {
      id: generateId(),
      type: 'multiple-choice',
      prompt: `Which statement about ${topic} is TRUE?`,
      options: ['It only works in Node.js', 'It adds runtime type checking', 'It compiles to JavaScript', 'It replaces JavaScript'],
      correctAnswer: 'It compiles to JavaScript',
      explanation: 'TypeScript is a superset of JavaScript that compiles down to plain JS.',
    },
  ];

  const makeLessons = (moduleId: string, moduleOrder: number, completed: number): Lesson[] =>
    Array.from({ length: 4 }, (_, i) => ({
      id: `lesson-${moduleId}-${i}`,
      moduleId,
      title: ['Core Concepts', 'Practical Patterns', 'Deep Dive', 'Challenge Lab'][i],
      type: (['reading', 'quiz', 'interactive', 'explain'] as const)[i % 4],
      status: (moduleOrder * 4 + i < completed ? 'completed' : moduleOrder * 4 + i === completed ? 'available' : 'locked') as 'completed' | 'available' | 'locked',
      estimatedMinutes: 8 + Math.floor(Math.random() * 12),
      order: i,
      content: { teachingBlock: `Learn about the fundamentals of this topic.`, questions: makeQuestions('TypeScript') },
    }));

  const courses: Course[] = [
    {
      id: 'course-ts',
      title: 'TypeScript Mastery',
      description: 'Master TypeScript from fundamentals to advanced patterns used in production codebases.',
      coverGradient: generateCoverGradient('TypeScript Mastery'),
      estimatedHours: 8,
      difficulty: 'intermediate',
      modules: Array.from({ length: 5 }, (_, i) => ({
        id: `mod-ts-${i}`,
        courseId: 'course-ts',
        title: ['Type Foundations', 'Advanced Types', 'Generics Deep Dive', 'Utility Types', 'Production Patterns'][i],
        description: ['Basic types, interfaces, and type annotations', 'Union types, intersections, and conditional types', 'Generic functions, classes, and constraints', 'Mapped types, template literals, and built-in utilities', 'Module patterns, declaration files, and best practices'][i],
        estimatedMinutes: 45 + i * 10,
        order: i,
        lessons: makeLessons(`mod-ts-${i}`, i, 12),
      })),
      createdAt: daysAgo(21),
      updatedAt: daysAgo(1),
      archived: false,
    },
    {
      id: 'course-italian',
      title: 'Italian Fundamentals',
      description: 'Begin your Italian journey with essential vocabulary, grammar, and conversational phrases.',
      coverGradient: generateCoverGradient('Italian Fundamentals'),
      estimatedHours: 12,
      difficulty: 'beginner',
      modules: Array.from({ length: 4 }, (_, i) => ({
        id: `mod-it-${i}`,
        courseId: 'course-italian',
        title: ['Greetings & Basics', 'Numbers & Time', 'Daily Routines', 'Food & Dining'][i],
        description: ['Essential greetings, introductions, and polite expressions', 'Counting, telling time, and scheduling', 'Describing your day and common activities', 'Restaurant vocabulary and food culture'][i],
        estimatedMinutes: 35 + i * 8,
        order: i,
        lessons: makeLessons(`mod-it-${i}`, i, 2),
      })),
      createdAt: daysAgo(14),
      updatedAt: daysAgo(3),
      archived: false,
    },
    {
      id: 'course-sysdesign',
      title: 'System Design Interviews',
      description: 'Ace your system design interviews with patterns for scalable distributed systems.',
      coverGradient: generateCoverGradient('System Design Interviews'),
      estimatedHours: 6,
      difficulty: 'advanced',
      modules: Array.from({ length: 4 }, (_, i) => ({
        id: `mod-sd-${i}`,
        courseId: 'course-sysdesign',
        title: ['Fundamentals', 'Database Design', 'Scalability', 'Case Studies'][i],
        description: ['Load balancers, caching, CDNs', 'SQL vs NoSQL, sharding, replication', 'Horizontal scaling, microservices', 'Design Twitter, URL shortener, chat system'][i],
        estimatedMinutes: 50 + i * 10,
        order: i,
        lessons: makeLessons(`mod-sd-${i}`, i, 14),
      })),
      createdAt: daysAgo(30),
      updatedAt: daysAgo(2),
      archived: false,
    },
    {
      id: 'course-photo',
      title: 'Photography Composition',
      description: 'Transform your photos with professional composition techniques and visual storytelling.',
      coverGradient: generateCoverGradient('Photography Composition'),
      estimatedHours: 4,
      difficulty: 'beginner',
      modules: Array.from({ length: 3 }, (_, i) => ({
        id: `mod-ph-${i}`,
        courseId: 'course-photo',
        title: ['Rule of Thirds', 'Leading Lines', 'Light & Shadow'][i],
        description: ['Grid placement and visual balance', 'Using lines to guide the viewer\'s eye', 'Natural and artificial light techniques'][i],
        estimatedMinutes: 30 + i * 10,
        order: i,
        lessons: makeLessons(`mod-ph-${i}`, i, 4),
      })),
      createdAt: daysAgo(10),
      updatedAt: daysAgo(5),
      archived: false,
    },
  ];

  return courses;
}

function generateSeedProgress(): Progress[] {
  const records: Progress[] = [];
  // 50+ completed lesson records across courses
  for (let i = 0; i < 52; i++) {
    const courseIds = ['course-ts', 'course-ts', 'course-ts', 'course-sysdesign', 'course-sysdesign', 'course-italian', 'course-photo'];
    const courseId = courseIds[i % courseIds.length];
    records.push({
      id: `progress-${i}`,
      userId: 'user_001',
      courseId,
      lessonId: `lesson-placeholder-${i}`,
      score: 65 + Math.floor(Math.random() * 36),
      completedAt: daysAgo(Math.floor(i / 3)),
      timeSpentMinutes: 5 + Math.floor(Math.random() * 20),
    });
  }
  return records;
}

function generateSeedStreak(): Streak {
  const activeDays: ActivityDay[] = [];
  for (let i = 20; i >= 0; i--) {
    const sessions = i === 7 ? 0 : 1 + Math.floor(Math.random() * 4); // one zero-day for realism
    activeDays.push({
      date: daysAgo(i),
      sessionsCompleted: sessions,
      minutesSpent: sessions * (8 + Math.floor(Math.random() * 15)),
      lessonsCompleted: sessions,
      xpEarned: sessions * (25 + Math.floor(Math.random() * 50)),
    });
  }
  return {
    id: 'streak_001',
    userId: 'user_001',
    currentStreak: 14,
    longestStreak: 14,
    lastActivityDate: daysAgo(0),
    totalSessions: 47,
    activeDays,
  };
}

function generateSeedNotifications(): Notification[] {
  return [
    { id: 'notif-1', type: 'streak_warning', title: 'Streak at risk!', message: "You haven't practiced Italian in 6 days. Quick review?", read: false, createdAt: daysAgo(0) },
    { id: 'notif-2', type: 'course_update', title: 'New content available', message: 'TypeScript Mastery added a bonus module on Decorators.', read: false, createdAt: daysAgo(1) },
    { id: 'notif-3', type: 'ai_insight', title: 'Learning insight', message: 'Your code examples retention rate is 40% higher than theory-only study.', read: true, createdAt: daysAgo(2) },
    { id: 'notif-4', type: 'achievement', title: '🏆 Two-Week Warrior!', message: "You've maintained a 14-day learning streak. Incredible dedication!", read: true, createdAt: daysAgo(3) },
    { id: 'notif-5', type: 'review_reminder', title: 'Review due', message: 'JavaScript Closures memory strength is declining. Review now?', read: false, createdAt: daysAgo(1) },
    { id: 'notif-6', type: 'ai_insight', title: 'Performance trend', message: "Your average score has improved 12% this week. You're accelerating!", read: true, createdAt: daysAgo(4) },
  ];
}

function generateSeedPrompts(): SystemPrompt[] {
  return [
    {
      id: 'prompt-1',
      promptId: 'prompt_generate_curriculum',
      description: 'Controls the curriculum generation pipeline',
      version: 'v2.1',
      status: 'active',
      template: `You are an expert curriculum designer and pedagogical architect. Given a topic from a learner, generate a comprehensive, structured course curriculum.

# Context
- Topic: {{topic_name}}
- Difficulty: {{difficulty_level}}
- Learner Profile: {{learner_profile}}

# Instructions
1. Create a course title that is specific and compelling
2. Write a 2-sentence description capturing the learning outcome
3. Structure into 4-5 modules, each with 4 lessons
4. Each lesson must have: title, type (reading/quiz/interactive/explain), estimated time
5. Ensure progressive difficulty: each module builds on the previous
6. Include practical exercises, not just theory
7. Calibrate the depth to the specified difficulty level

# @directives
@output_format: json_strict
@temperature: 0.7
@max_tokens: 2000

# Output Schema
Return a valid JSON object matching the Course type schema.`,
      expectedSchema: JSON.stringify({
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
          estimatedHours: { type: 'number' },
          modules: { type: 'array', items: { type: 'object' } },
        },
      }, null, 2),
      variables: ['topic_name', 'difficulty_level', 'learner_profile'],
      createdAt: daysAgo(30),
      updatedAt: daysAgo(5),
    },
    {
      id: 'prompt-2',
      promptId: 'prompt_score_answer',
      description: 'Empathetic diagnostic scoring with retry logic',
      version: 'v1.4',
      status: 'active',
      template: `You are a patient, empathetic tutor evaluating a learner's response.

# Context
- Question: {{question_text}}
- Expected Answer: {{expected_answer}}
- User Answer: {{user_answer}}
- Topic: {{topic_name}}
- Attempt Number: {{attempt_number}}

# Instructions
1. Compare the user's answer to the expected answer semantically, not just string matching
2. Score from 0-100 based on conceptual accuracy
3. Identify specific strengths in their response
4. Identify missing concepts with actionable suggestions
5. If this is attempt 2+, provide a more detailed hint
6. Tone: encouraging but honest. Never condescending.

# @directives
@output_format: json_strict
@temperature: 0.4`,
      expectedSchema: JSON.stringify({
        type: 'object',
        properties: {
          score: { type: 'number' },
          grade: { type: 'string' },
          strengths: { type: 'array', items: { type: 'string' } },
          missingConcepts: { type: 'array', items: { type: 'string' } },
          suggestion: { type: 'string' },
        },
      }, null, 2),
      variables: ['question_text', 'expected_answer', 'user_answer', 'topic_name', 'attempt_number'],
      createdAt: daysAgo(25),
      updatedAt: daysAgo(3),
    },
    {
      id: 'prompt-3',
      promptId: 'prompt_simplify_text',
      description: 'Explain Like I\'m 5 transformations',
      version: 'v1.0',
      status: 'active',
      template: `You are a master explainer who can make complex concepts accessible to anyone.

# Context
- Original Text: {{original_text}}
- Current Difficulty: {{difficulty_level}}
- Target Simplification: {{target_level}}

# Instructions
1. Rewrite the text using simple, everyday language
2. Use analogies from real life (cooking, sports, building)
3. Preserve technical accuracy — don't sacrifice correctness for simplicity
4. Keep the same approximate length (±20%)
5. If code is involved, add inline comments explaining each line

# @directives
@output_format: text
@temperature: 0.6`,
      expectedSchema: JSON.stringify({
        type: 'object',
        properties: {
          simplifiedText: { type: 'string' },
          analogyUsed: { type: 'string' },
        },
      }, null, 2),
      variables: ['original_text', 'difficulty_level', 'target_level'],
      createdAt: daysAgo(20),
      updatedAt: daysAgo(10),
    },
  ];
}

function generateSeedMemoryItems(): MemoryItem[] {
  const items: MemoryItem[] = [
    { id: 'mem-1', conceptName: 'Type Annotations', courseId: 'course-ts', lessonId: 'l1', memoryStrength: 92, lastReviewed: daysAgo(1), nextReviewAt: daysAgo(-5), easeFactor: 2.5, interval: 7, repetitions: 4 },
    { id: 'mem-2', conceptName: 'Union Types', courseId: 'course-ts', lessonId: 'l2', memoryStrength: 78, lastReviewed: daysAgo(3), nextReviewAt: daysAgo(-2), easeFactor: 2.3, interval: 5, repetitions: 3 },
    { id: 'mem-3', conceptName: 'Generic Constraints', courseId: 'course-ts', lessonId: 'l3', memoryStrength: 55, lastReviewed: daysAgo(6), nextReviewAt: daysAgo(0), easeFactor: 2.0, interval: 3, repetitions: 2 },
    { id: 'mem-4', conceptName: 'Italian Greetings', courseId: 'course-italian', lessonId: 'l4', memoryStrength: 88, lastReviewed: daysAgo(2), nextReviewAt: daysAgo(-4), easeFactor: 2.6, interval: 8, repetitions: 5 },
    { id: 'mem-5', conceptName: 'Closures & Scope', courseId: 'course-ts', lessonId: 'l5', memoryStrength: 42, lastReviewed: daysAgo(8), nextReviewAt: daysAgo(1), easeFactor: 1.8, interval: 2, repetitions: 1 },
    { id: 'mem-6', conceptName: 'CAP Theorem', courseId: 'course-sysdesign', lessonId: 'l6', memoryStrength: 96, lastReviewed: daysAgo(0), nextReviewAt: daysAgo(-10), easeFactor: 2.8, interval: 14, repetitions: 6 },
    { id: 'mem-7', conceptName: 'Database Sharding', courseId: 'course-sysdesign', lessonId: 'l7', memoryStrength: 65, lastReviewed: daysAgo(4), nextReviewAt: daysAgo(-1), easeFactor: 2.1, interval: 4, repetitions: 2 },
    { id: 'mem-8', conceptName: 'Rule of Thirds', courseId: 'course-photo', lessonId: 'l8', memoryStrength: 35, lastReviewed: daysAgo(10), nextReviewAt: daysAgo(2), easeFactor: 1.6, interval: 2, repetitions: 1 },
  ];
  return items;
}

function generateSeedLifePulse(): LifePulseData {
  return {
    stressLevel: 35,
    sleepQuality: 78,
    focusScore: 82,
    lastSynced: daysAgo(0),
    status: 'optimal',
  };
}

// ─── DB Adapter Interface ────────────────────────

export const db = {
  async getAll<T>(collection: string): Promise<T[]> {
    await delay();
    return readCollection<T>(collection);
  },

  async getById<T extends { id: string }>(collection: string, id: string): Promise<T | null> {
    await delay();
    const items = readCollection<T>(collection);
    return items.find((item) => item.id === id) ?? null;
  },

  async create<T extends { id?: string }>(collection: string, item: T): Promise<T> {
    await delay();
    const newItem = { ...item, id: item.id || generateId() } as T;
    const items = readCollection<T>(collection);
    items.push(newItem);
    writeCollection(collection, items);
    logger.info('DB', `Created item in ${collection}`, { id: (newItem as { id: string }).id });
    return newItem;
  },

  async update<T extends { id: string }>(collection: string, id: string, updates: Partial<T>): Promise<T> {
    await delay();
    const items = readCollection<T>(collection);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Item not found: ${collection}/${id}`);
    items[index] = { ...items[index], ...updates };
    writeCollection(collection, items);
    logger.info('DB', `Updated item in ${collection}`, { id });
    return items[index];
  },

  async delete(collection: string, id: string): Promise<void> {
    await delay();
    const items = readCollection<{ id: string }>(collection);
    const filtered = items.filter((item) => item.id !== id);
    writeCollection(collection, filtered);
    logger.info('DB', `Deleted item from ${collection}`, { id });
  },

  async query<T>(collection: string, filter: (item: T) => boolean): Promise<T[]> {
    await delay();
    const items = readCollection<T>(collection);
    return items.filter(filter);
  },

  async getAppState<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(DB_PREFIX + 'state-' + key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async setAppState<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(DB_PREFIX + 'state-' + key, JSON.stringify(value));
  },

  async isSeeded(): Promise<boolean> {
    return localStorage.getItem(SEEDED_KEY) === 'true';
  },

  async seed(): Promise<void> {
    if (await db.isSeeded()) {
      logger.debug('DB', 'Database already seeded, skipping');
      return;
    }

    logger.info('DB', 'Seeding database with initial data...');

    const courses = generateSeedCourses();
    writeCollection('courses', courses);
    writeCollection('progress', generateSeedProgress());
    writeCollection('streaks', [generateSeedStreak()]);
    writeCollection('notifications', generateSeedNotifications());
    writeCollection('prompts', generateSeedPrompts());
    writeCollection('memoryItems', generateSeedMemoryItems());
    writeCollection('lifepulse', [generateSeedLifePulse()]);

    const onboarding: OnboardingState = {
      completed: true,
      currentStep: 5,
      interests: ['programming', 'languages', 'design'],
      skillLevels: { programming: 4, languages: 2, design: 2 },
      learningGoal: 'daily',
      dailyGoalMinutes: 30,
    };
    await db.setAppState('onboarding', onboarding);
    await db.setAppState('courseGenerationCount', 2);

    localStorage.setItem(SEEDED_KEY, 'true');
    logger.info('DB', 'Database seeded successfully', {
      courses: courses.length,
      notifications: 6,
      prompts: 3,
      memoryItems: 8,
    });
  },

  // ─── Specialized Queries ───────────────────

  async getCourseProgress(courseId: string): Promise<{ overall: number; byModule: Record<string, number> }> {
    const courses = readCollection<Course>('courses');
    const course = courses.find((c) => c.id === courseId);
    if (!course) return { overall: 0, byModule: {} };

    let totalLessons = 0;
    let completedLessons = 0;
    const byModule: Record<string, number> = {};

    for (const mod of course.modules) {
      const modTotal = mod.lessons.length;
      const modCompleted = mod.lessons.filter((l) => l.status === 'completed').length;
      totalLessons += modTotal;
      completedLessons += modCompleted;
      byModule[mod.id] = modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0;
    }

    return {
      overall: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      byModule,
    };
  },

  async generateCourse(topic: string): Promise<Course> {
    // Simulate LLM generation
    const id = `course-${generateId()}`;
    const titleMap: Record<string, string> = {
      default: `Mastering ${topic.charAt(0).toUpperCase() + topic.slice(1)}`,
    };
    const title = titleMap.default;

    const moduleNames = [
      'Foundation & Core Concepts',
      'Building Blocks & Patterns',
      'Applied Techniques',
      'Advanced Strategies',
      'Real-World Projects',
    ];

    const modules: Module[] = moduleNames.slice(0, 4 + Math.floor(Math.random() * 2)).map((name, i) => ({
      id: `mod-${id}-${i}`,
      courseId: id,
      title: name,
      description: `Learn ${name.toLowerCase()} for ${topic}`,
      estimatedMinutes: 30 + i * 10,
      order: i,
      lessons: Array.from({ length: 4 }, (_, j) => ({
        id: `lesson-${id}-${i}-${j}`,
        moduleId: `mod-${id}-${i}`,
        title: `${name} - Part ${j + 1}`,
        type: (['reading', 'quiz', 'interactive', 'explain'] as const)[j % 4],
        status: (i === 0 && j === 0 ? 'available' : 'locked') as 'available' | 'locked',
        estimatedMinutes: 8 + Math.floor(Math.random() * 10),
        order: j,
      })),
    }));

    const newCourse: Course = {
      id,
      title,
      description: `A comprehensive learning path to master ${topic}. From fundamentals to advanced concepts.`,
      coverGradient: generateCoverGradient(title),
      estimatedHours: Math.round(modules.reduce((sum, m) => sum + m.estimatedMinutes, 0) / 60),
      difficulty: 'intermediate',
      modules,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false,
    };

    const courses = readCollection<Course>('courses');
    courses.push(newCourse);
    writeCollection('courses', courses);

    logger.info('DB', 'Generated new course', { id, title });
    return newCourse;
  },
};
