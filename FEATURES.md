# Skill-Tango Features

This document outlines the core feature set of the Skill-Tango platform.

## 1. Dynamic AI Assessment
- **Feature**: Instead of checking checkboxes, a user interacts with a 3-question chat test generated on the fly.
- **Tech**: OpenAI GPT-4o-mini generating context-aware queries and grading the natural language responses.
- **Value**: A fun, highly personalized starting point that skips the boring stuff they already know.

## 2. JIT (Just-In-Time) Curriculum Generation
- **Feature**: The Skill Tree. A multi-chapter accordion roadmap tailored exactly to the user's current baseline and target depth.
- **Tech**: OpenAI GPT-4o outputting deeply nested JSON (Chapters -> Lessons).
- **Value**: Infinite possible courses. Someone wanting to learn Python for Data Science gets a totally different tree than someone learning Python for Web Scraping.

## 3. Multimodal Lesson Delivery
- **Feature**: Lessons are generated when unlocked, matching the exact target level requested.
- **Tech**: 
  - Text: GPT-4o-mini
  - Audio: ElevenLabs TTS API
  - Images (Planned): NVIDIA Stable Diffusion NIM
- **Value**: Accommodates all learning styles (visual, reading, listening) without having to manually record thousands of hours of audio.

## 4. Gamified Verification
- **Feature**: End-of-lesson interactive quizzes.
- **Tech**: React state engine grading dynamically generated JSON exercises.
- **Value**: Ensures retention before advancing the tree.

## 5. Progress Tracking (Planned Phase 5)
- **Feature**: XP, Streaks, Daily Goals.
- **Tech**: Native Convex Database querying.
- **Value**: High engagement and high retention loops (the "Duolingo Effect").
