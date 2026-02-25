import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

const ASSESS_BASELINE_SYSTEM = `You are a friendly, encouraging AI tutor for the Skill-Tango platform.
You need to assess the user's baseline knowledge on a specific topic before generating their custom curriculum.

CRITICAL INSTRUCTION: You MUST respond with ONLY a raw JSON object. No markdown, no code fences, no explanation, no commentary before or after the JSON. Your entire response must start with { and end with }.

The JSON object MUST match this exact structure:
{"assessmentMessage":"A friendly entry message introducing the test...","questions":["Question 1 (Basic)...","Question 2 (moderate)...","Question 3 (challenging)..."]}`;

const ASSESS_BASELINE_USER = `Generate a 3-question baseline assessment for a user wanting to learn about "{{topic}}".
Their self-reported target level is "{{targetLevel}}".
Remember: respond with ONLY raw JSON. No other text.`;

const GRADE_ASSESSMENT_SYSTEM = `You are the master curriculum builder for Skill-Tango.
You receive a user's answers to a 3-question baseline test.
1. Grade their answers strictly but fairly (0-100).
2. Generate a personalized, highly structured learning curriculum (Chapters -> Lessons) that bridges the gap between their baseline performance and their target level.
3. Completely skip topics they clearly already know.

CRITICAL INSTRUCTION: You MUST respond with ONLY a raw JSON object. No markdown, no code fences, no explanation, no commentary before or after the JSON. Your entire response must start with { and end with }.

The JSON object MUST match this exact structure:
{"score":0,"feedback":"A short, encouraging paragraph analyzing their performance.","curriculum":{"title":"Course Title","description":"Short description","chapters":[{"title":"Chapter 1","lessons":[{"title":"Lesson 1.1"}]}]}}`;

const GRADE_ASSESSMENT_USER = `User Topic: {{topic}}
Target Level: {{targetLevel}}
Requested Modalities: {{modalities}}

Assessment Questions:
{{questions}}

User Answers:
{{answers}}

Grade them and generate their custom curriculum. Respond with ONLY raw JSON. No other text.`;

const CONTENT_GENERATOR_SYSTEM = `You are an expert AI tutor for the Skill-Tango platform.
Write a thorough, engaging lesson on: "{{lessonTitle}}" (part of "{{chapterTitle}}" in a course about "{{topic}}").
The student's target level is: {{targetLevel}}.
Format as clean, readable paragraphs. Use concrete analogies. Keep the tone encouraging and engaging. 700-900 words.
NOTE: For this prompt you should return plain text (not JSON). Just write the lesson content directly.`;

const EXERCISE_GENERATOR_SYSTEM = `Based on this lesson about "{{lessonTitle}}", generate exactly 2 multiple_choice quiz exercises to verify the student's understanding.
Lesson context:
{{lessonContext}}

CRITICAL INSTRUCTION: You MUST respond with ONLY a raw JSON object. No markdown, no code fences, no explanation, no commentary before or after the JSON. Your entire response must start with { and end with }.

The JSON object MUST match this exact structure:
{"exercises":[{"question":"...","options":["A","B","C","D"],"correctAnswer":"A","explanation":"..."},{"question":"...","options":["A","B","C","D"],"correctAnswer":"C","explanation":"..."}]}`;

const DEFAULT_PROMPTS = [
    {
        promptId: "assess_baseline_system",
        name: "Assess Baseline (System)",
        content: ASSESS_BASELINE_SYSTEM,
        description: "Instructs the model to generate the 3 baseline test questions as strict JSON."
    },
    {
        promptId: "assess_baseline_user",
        name: "Assess Baseline (User)",
        content: ASSESS_BASELINE_USER,
        description: "Provides the topic and target level."
    },
    {
        promptId: "grade_assessment_system",
        name: "Grade Assessment & Build Curriculum (System)",
        content: GRADE_ASSESSMENT_SYSTEM,
        description: "Instructs the orchestrator model to grade answers and structure a JSON course tree."
    },
    {
        promptId: "grade_assessment_user",
        name: "Grade Assessment (User)",
        content: GRADE_ASSESSMENT_USER,
        description: "Passes the raw answers and questions to the grader."
    },
    {
        promptId: "content_generator_system",
        name: "Lesson Content Generator",
        content: CONTENT_GENERATOR_SYSTEM,
        description: "System prompt for generating standard markdown lesson text."
    },
    {
        promptId: "exercise_generator_system",
        name: "Exercise Generator",
        content: EXERCISE_GENERATOR_SYSTEM,
        description: "Extracts an array of JSON exercises based on the generated text."
    }
];

export const getPrompts = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("aiPrompts").collect();
    },
});

export const getPromptContent = internalQuery({
    args: { promptId: v.string() },
    handler: async (ctx, { promptId }) => {
        const prompt = await ctx.db
            .query("aiPrompts")
            .withIndex("by_prompt_id", (q) => q.eq("promptId", promptId))
            .first();
        return prompt?.content;
    },
});

export const updatePrompt = mutation({
    args: {
        id: v.id("aiPrompts"),
        content: v.string(),
    },
    handler: async (ctx, { id, content }) => {
        await ctx.db.patch(id, {
            content,
            updatedAt: Date.now(),
        });
    },
});

export const seedPrompts = mutation({
    args: {},
    handler: async (ctx) => {
        const existing = await ctx.db.query("aiPrompts").collect();
        const existingIds = new Set(existing.map((p) => p.promptId));

        let added = 0;
        for (const prompt of DEFAULT_PROMPTS) {
            if (!existingIds.has(prompt.promptId)) {
                await ctx.db.insert("aiPrompts", {
                    ...prompt,
                    updatedAt: Date.now(),
                });
                added++;
            }
        }
        return `Seeded ${added} missing prompts.`;
    },
});

/**
 * Force-updates ALL prompts to match the latest defaults.
 * Use this after changing prompt text in code to push updates to the DB.
 */
export const reseedPrompts = mutation({
    args: {},
    handler: async (ctx) => {
        const existing = await ctx.db.query("aiPrompts").collect();
        const existingMap = new Map(existing.map((p) => [p.promptId, p._id]));

        let updated = 0;
        let added = 0;
        for (const prompt of DEFAULT_PROMPTS) {
            const existingId = existingMap.get(prompt.promptId);
            if (existingId) {
                await ctx.db.replace(existingId, {
                    ...prompt,
                    updatedAt: Date.now(),
                });
                updated++;
            } else {
                await ctx.db.insert("aiPrompts", {
                    ...prompt,
                    updatedAt: Date.now(),
                });
                added++;
            }
        }
        return `Reseeded: ${updated} updated, ${added} added.`;
    },
});
