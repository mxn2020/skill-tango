# Development Roadmap

This roadmap tracks the development phases of the Skill-Tango project.

### Phase 1: Scaffolding (Completed)
- [x] Initial Vite + React environment.
- [x] Convex backend initialization.
- [x] Global CSS design system (Cyber-cyan glassmorphism).

### Phase 2: Database Architecture (Completed)
- [x] Define \`schema.ts\` (courses, chapters, lessons, exercises).
- [x] Configure AI API keys (OpenAI, ElevenLabs).

### Phase 3: AI Orchestration (Completed)
- [x] \`assessBaseline\` action (Chat-based grading).
- [x] \`gradeAssessmentAndGenerateCurriculum\` action (Skill Tree builder).
- [x] \`generateLessonDirect\` action (Text and Quiz multi-modal synthesis).

### Phase 4: Frontend Flow (Completed)
- [x] App routing skeleton.
- [x] Topic Selection UI.
- [x] Assessment Chat UX.
- [x] Accordion Course Roadmap.
- [x] Multimedia Lesson Player.

### Phase 5: Gamification & User Accounts (Upcoming)
- [ ] Connect Clerk or Convex Auth for user accounts.
- [ ] Tie generated courses to a specific \`userId\` in the DB.
- [ ] Implement XP system for passing lesson quizzes.
- [ ] Daily Streak counter.

### Phase 6: Polish & Launch
- [ ] Add loading skeletons during AI generation phases.
- [ ] Implement SD Image generation integration in lessons.
- [ ] E2E testing.
- [ ] Production deployment.
