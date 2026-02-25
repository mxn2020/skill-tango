# System Architecture

## Overview
Skill-Tango is built on an **AI-native edge architecture** using Convex. 
Unlike traditional CRUD apps where data sits dormant, Skill-Tango generates its primary content—the lessons, audio, and exercises—*lazily*, just-in-time, as the user unlocks nodes on their Skill Tree.

## Core Components

### 1. The Assessment Engine (GPT-4o-mini)
When a user requests a new topic, the system generates a small, dynamic baseline quiz instead of a static form. This allows the AI to effectively grade the user's true starting point (Score: 0-100).

### 2. The Curriculum Builder (GPT-4o)
Using the baseline score, the Curriculum builder outputs a deeply nested JSON hierarchy:
\`\`\`json
{
  "title": "Quantum Mechanics for Beginners",
  "chapters": [
    {
      "title": "Wave-Particle Duality",
      "lessons": [{ "title": "The Double Slit Experiment" }]
    }
  ]
}
\`\`\`
This data populates the interactive **Skill Tree Accordion**. At this stage, no actual lesson *content* exists—only the titles and structure.

### 3. Just-in-Time Action Generators
When a user clicks "Start Lesson", a Convex Action is fired:
1. **Text Generator**: Prompts GPT-4o-mini to write a detailed markdown lesson based on the Title + Chapter context.
2. **Quiz Generator**: Prompts GPT-4o-mini to return a JSON array of 2 multiple-choice questions testing the newly generated text.
3. **Audio Synthesizer**: Uses ElevenLabs TTS to read the lesson text, immediately piping the binary blob into Convex Storage natively.

### 4. Reactive UI
Because Convex queries are inherently reactive, the \`LessonPlayer\` component automatically transitions from "Generating..." to displaying the content the exact millisecond the async AI Pipeline finishes patching the database.
