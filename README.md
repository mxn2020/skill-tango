# Skill-Tango

**Skill-Tango** is a dynamic, AI-first personalized learning platform. 
Instead of static, highly produced courses that quickly become outdated, Skill-Tango uses generative AI to instantly build a personalized syllabus based on the user's specific learning goals, target depth, and chosen learning modalities (Visual, Auditory, Text).

## Core Concept
1. **Topic Input & Assessment**: The user states a topic (e.g., "Intermediate Python", "History of Rome") and desired depth. The AI generates a 3-question interactive chat to gauge their baseline knowledge.
2. **Dynamic Syllabus Generation**: Based on the baseline score, the AI generates a multi-level curriculum (Chapters -> Lessons). It intelligently skips basics if the user already knows them.
3. **Multimodal Lesson Delivery**: When a lesson is unlocked, the AI asynchronously generates the educational text, synthesized audio (via ElevenLabs), and interactive quiz exercises on the fly.
4. **Gamification & Mastery**: Users earn XP, maintain streaks, and unlock a "Skill Tree" as they complete lessons and pass exercises.

---

## Tech Stack
- **Frontend**: React, Vite, TypeScript
- **Styling**: Custom CSS Design System (Cyan/Emerald "Dark Glassmorphism" aesthetic)
- **Backend & Database**: Convex (Real-time NoSQL, Serverless Actions)
- **AI Orchestration**: 
  - Text & Logic: OpenAI (GPT-4o, GPT-4o-mini)
  - Audio (TTS): ElevenLabs

## Setup & Local Development
1. Clone the repo and \`cd skill-tango/web\`
2. Install dependencies: \`npm install\`
3. Start the Convex backend: \`npx convex dev\`
4. In a separate terminal, start the Vite frontend: \`npm run dev\`

**Environment Variables Required (Convex):**
- \`OPENAI_API_KEY\`
- \`ELEVENLABS_API_KEY\`
- \`NVIDIA_API_KEY\` (Optional, for potential SD visual generation)
