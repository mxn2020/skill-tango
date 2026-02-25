# Content Strategy

Unlike traditional LMS (Learning Management Systems) like Udemy or Thinkific, Skill-Tango has **ZERO pre-authored content**. 

## The Zero-Content Model
The platform is an orchestration engine. Content is entirely a byproduct of the user's interaction with the assessment AI.

### Modality Synthesis
1. **Text**: Generated via `gpt-4o-mini` directly into a styled markdown renderer.
2. **Audio**: Generated via ElevenLabs. The `lessonContent` AI response is sliced into 3,000 character chunks (limit) and synthesized by a pre-selected professional voice model (e.g., "Adam"). The resulting blob is stored in Convex Storage and played natively via HTML5 audio.
3. **Quizzes**: Generated dynamically as JSON objects representing multiple choice questions with boolean answers and explanations.

### Latency Management
Generating thousands of words of text and synthesizing audio takes time (10-30 seconds). To maintain the illusion of speed:
- Content is generated lazily ONLY when a user unlocks/selects the exact lesson from their Skill Tree. 
- While generating, a sleek pulsing "Building your lesson..." loader is displayed. 
- The user is fully aware that an AI is "writing" their textbook in real time, making the delay a feature, not a bug.
