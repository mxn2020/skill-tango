# Monetization Strategy

## Overview
Skill-Tango provides massive value through extreme personalization and multi-modal synthesis (text + professional audio). However, AI generation carries hard token costs (OpenAI, ElevenLabs).

The monetization model must align the value of the tailored curriculum with the infrastructure costs.

## Model: Tiered Subscription ("Skill-Tango Plus")

### Free Tier (The Hook)
- **Features**: 
  - 1 Free Assessment per month.
  - Course generation up to 3 chapters.
  - Text-only modality.
- **Goal**: Show the magic of the dynamic generation. Prove that learning can be hyper-tailored.

### Plus Tier ($15/mo)
- **Features**:
  - Unlimited Assessments and Course Generations.
  - Deep-dive target levels (Advanced/Expert mode).
  - **Full Modalities**: Unlock ElevenLabs TTS Audio and SD Image generation.
  - Advanced Gamification (Leaderboards, specific Certificates of Completion).
- **Goal**: Target power learners, hobbyists, and professionals who would otherwise spend $50+ on static Udemy or Coursera courses that contain hours of fluff they already know.

## Infrastructure Cost Mitigation
1. **Lazy Loading**: Text/Audio is only generated when a user clicks "Start Lesson". We never pre-generate a 50-lesson course if the user abandons it at lesson 3.
2. **Model Downgrading**: Use \`gpt-4o-mini\` for the heavy text generation inside lessons to slash token costs while maintaining quality.
3. **Audio Caching**: Since ElevenLabs is the most expensive API per character, we store the generated audio blobs in Convex Storage. If two users request the exact same lesson text, we reuse the audio blob object instead of hitting the ElevenLabs API again.
