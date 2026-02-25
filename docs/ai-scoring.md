# AI Scoring and Assessment Tuning

The Baseline Assessment is the critical hook of the Skill-Tango platform. If the assessment feels generic or easy to trick, the user will not trust the generated curriculum.

## The Chat Interface
We use an interactive `AssessmentChat` React component instead of a traditional form. 
- The AI ("Tutor") asks 3 dynamic, context-aware questions derived from the user's `Topic` and `Target Level` input.
- The state engine tracks the Q&A array and only submits to the grader once all questions have a user response.

## The Grader Prompt (GPT-4o-mini)
The grader receives the raw Q&A array and must output a JSON object containing a `score` (0-100) and a `feedback` string.

### Strictness Tuning
- **Beginner Target**: The AI is lenient. If the user knows basic vocabulary, they score highly relative to the baseline.
- **Advanced Target**: The AI is ruthless. It looks for deep conceptual understanding. If the user gives a generic Wikipedia answer without nuance, the score will be crushed.

### Fallback Handling
If a user answers with gibberish or "I don't know", the grading AI will assign a score of 0, triggering the curriculum builder to generate a purely foundational, from-scratch course structure.
