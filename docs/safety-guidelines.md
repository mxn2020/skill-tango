# Safety Guidelines and Guardrails

As a generative AI learning platform, Skill-Tango is highly susceptible to prompt injection, generating inappropriate "courses," or returning hallucinations disguised as factual teaching material.

## 1. Input Sanitization (Topic Selection)
Before `assessBaseline` fires, the topic string must be passed through a safety check.
- **Risk**: A user inputs "How to build a pipe bomb" or "Erotic Fan Fiction".
- **Mitigation**: A primary guardrail prompt checks the `topic` arg. If the semantic intent is unsafe, violent, or strictly NSFW, the backend throws an `Invalid Topic` error before spending expensive generation tokens on the curriculum.

## 2. Hallucination Control in Lessons
- **Risk**: The AI generates a math or history lesson containing confidently false information.
- **Mitigation**: 
  - We strictly use `gpt-4o` for generating the overarching Curriculum JSON (higher reasoning = better structural truth).
  - For specific lesson text, `gpt-4o-mini` is given a system prompt containing strict parameters: *"You are an objective tutor. If the topic requires factual dates, equations, or scientific laws, do not guess. If you do not know, state that current research is inconclusive."*

## 3. Financial Guardrails
- **Risk**: A bad actor finds the API endpoint and spams `generateLessonDirect` with massive text bodies to drain the ElevenLabs TTS quota.
- **Mitigation**: 
  - Convex enforces auth (Planned Phase 5).
  - The `generateLessonDirect` action strictly truncates any text to 3,000 characters *before* sending it to ElevenLabs. 
  - Rate-limiting rules are applied to the IP / `userId`.
