// ═══════════════════════════════════════════════════
// Skill-Tango — AI Briefing Engine
// Dynamic contextual messages from user state
// ═══════════════════════════════════════════════════

import type { AIBriefing, Course, Streak, MemoryItem, LifePulseData, UserPreferences } from '../types';

interface UserState {
  courses: Course[];
  streak: Streak | null;
  memoryItems: MemoryItem[];
  lifePulse: LifePulseData | null;
  preferences: UserPreferences;
  userName: string;
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function getGreeting(name: string, style: string): string {
  const tod = getTimeOfDay();
  const greetings: Record<string, string[]> = {
    morning: [`Good morning, ${name}! ☀️`, `Rise and learn, ${name}!`, `Fresh day, fresh knowledge, ${name}.`],
    afternoon: [`Good afternoon, ${name}! 🎯`, `Afternoon focus mode, ${name}.`, `Keep the momentum going, ${name}!`],
    evening: [`Evening session, ${name}? 🌙`, `Night owl learning, ${name}! 🦉`, `Winding down with some knowledge, ${name}.`],
  };
  const pool = greetings[tod];
  if (style === 'direct') return pool[0];
  if (style === 'supportive') return pool[2];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function generateBriefing(state: UserState): AIBriefing {
  const { courses, streak, memoryItems, lifePulse, preferences, userName } = state;

  // Greeting
  const greeting = getGreeting(userName, preferences.coachingStyle);

  // Insight — based on data patterns
  let insight = '';
  const activeCourses = courses.filter((c) => !c.archived);
  const weakItems = memoryItems.filter((m) => m.memoryStrength < 50);
  const strongItems = memoryItems.filter((m) => m.memoryStrength > 85);

  if (streak && streak.currentStreak >= 7) {
    insight = `You've been crushing it — ${streak.currentStreak}-day streak! 🔥 ${strongItems.length} concepts are rock-solid in your memory.`;
  } else if (weakItems.length > 2) {
    insight = `${weakItems.length} concepts are fading — "${weakItems[0].conceptName}" and "${weakItems[1].conceptName}" need review before they slip away.`;
  } else if (activeCourses.length > 0) {
    const topCourse = activeCourses[0];
    insight = `"${topCourse.title}" is your strongest active course. Keep that momentum going!`;
  } else {
    insight = `Your learning journey is just getting started. Every expert was once a beginner.`;
  }

  // LifePulse integration
  if (lifePulse && lifePulse.status === 'overloaded') {
    insight = `LifePulse shows elevated stress (${lifePulse.stressLevel}%). Let's do a light vocabulary refresh instead of new material today.`;
  }

  // Suggestion
  let suggestion = '';
  if (weakItems.length > 0) {
    suggestion = `Start with a quick review of "${weakItems[0].conceptName}" — it only takes 5 minutes to reinforce.`;
  } else if (activeCourses.length > 0) {
    suggestion = `Continue where you left off in "${activeCourses[0].title}" — consistency beats intensity.`;
  } else {
    suggestion = `Explore the course library and generate your first AI-powered curriculum!`;
  }

  // Encouragement — adapts to coaching style
  const encouragements: Record<string, string[]> = {
    direct: [
      'Focus in. Execute. Repeat.',
      'No shortcuts. Put in the work.',
      "Let's hit today's target.",
    ],
    supportive: [
      "You're doing amazing — every session counts! 💚",
      "Remember, it's about progress, not perfection.",
      "I believe in your ability to master this.",
    ],
    balanced: [
      "Let's make today count. You've got this.",
      'Small consistent steps lead to mastery.',
      "Ready when you are — let's learn something new.",
    ],
  };
  const pool = encouragements[preferences.coachingStyle] || encouragements.balanced;
  const encouragement = pool[Math.floor(Math.random() * pool.length)];

  return { greeting, insight, suggestion, encouragement };
}

// Generate quick AI insights for the stats page
export function generateLearningInsights(state: UserState): string[] {
  const insights: string[] = [];
  const { streak, memoryItems, courses } = state;

  if (streak && streak.activeDays.length > 7) {
    const recentAvg = streak.activeDays.slice(0, 7).reduce((s, d) => s + d.minutesSpent, 0) / 7;
    insights.push(`You average ${Math.round(recentAvg)} minutes of learning per day this week.`);
  }

  const strongCourse = courses.reduce((best, c) => {
    const completed = c.modules.flatMap((m) => m.lessons).filter((l) => l.status === 'completed').length;
    const total = c.modules.flatMap((m) => m.lessons).length;
    const pct = total > 0 ? completed / total : 0;
    return pct > (best.pct || 0) ? { course: c, pct } : best;
  }, { course: null as Course | null, pct: 0 });

  if (strongCourse.course) {
    insights.push(`"${strongCourse.course.title}" is your strongest domain — ${Math.round(strongCourse.pct * 100)}% complete.`);
  }

  const overdueItems = memoryItems.filter((m) => m.memoryStrength < 60);
  if (overdueItems.length > 0) {
    insights.push(`${overdueItems.length} concepts have declining memory strength. A quick review session would solidify them.`);
  }

  return insights.slice(0, 3);
}
