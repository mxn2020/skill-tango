import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { performNvidiaCall } from "./nvidia";

const MODEL_FAST = "meta/llama-3.1-8b-instruct";
const MODEL_COMPLEX = "meta/llama-3.1-70b-instruct";

function fillTemplate(template: string, vars: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] !== undefined ? String(vars[key]) : "");
}

function parseJsonResponse(raw: string): any {
  let cleaned = raw.trim();
  // Strip markdown code fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  // First try raw parse
  try {
    return JSON.parse(cleaned);
  } catch {
    // Llama models often wrap JSON in prose. Extract the first { ... } block.
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const jsonStr = cleaned.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(jsonStr);
      } catch (e2) {
        console.error('[AI Pipeline] Failed to parse extracted JSON:', jsonStr, e2);
        throw new Error('AI returned invalid JSON');
      }
    }
    console.error('[AI Pipeline] No JSON object found in response:', cleaned);
    throw new Error('AI returned invalid JSON');
  }
}

export const assessBaseline = action({
  args: {
    topic: v.string(),
    targetLevel: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { topic, targetLevel, language = 'English' } = args;

    const systemPrompt = await ctx.runQuery(internal.prompts.getPromptContent, { promptId: "assess_baseline_system" });
    const userPromptTpl = await ctx.runQuery(internal.prompts.getPromptContent, { promptId: "assess_baseline_user" });

    if (!systemPrompt || !userPromptTpl) throw new Error("Prompts not found in DB");

    const userPrompt = fillTemplate(userPromptTpl, { topic, targetLevel, language });

    const completionStr = await performNvidiaCall(ctx, {
      model: MODEL_FAST,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      caller: "aiPipeline:assessBaseline"
    });

    return parseJsonResponse(completionStr);
  },
});

export const gradeAssessmentAndGenerateCurriculum = action({
  args: {
    topic: v.string(),
    targetLevel: v.string(),
    modalities: v.array(v.string()),
    questions: v.array(v.string()),
    answers: v.array(v.string()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { topic, targetLevel, modalities, questions, answers, language = 'English' } = args;

    const systemPromptGrading = await ctx.runQuery(internal.prompts.getPromptContent, { promptId: "grade_assessment_system" });
    const userPromptGradingTpl = await ctx.runQuery(internal.prompts.getPromptContent, { promptId: "grade_assessment_user" });

    if (!systemPromptGrading || !userPromptGradingTpl) throw new Error("Prompts not found in DB");

    const userPromptGrading = fillTemplate(userPromptGradingTpl, {
      topic,
      targetLevel,
      language,
      modalities: modalities.join(', '),
      questions: questions.join('\n'),
      answers: answers.join('\n')
    });

    const completionStr = await performNvidiaCall(ctx, {
      model: MODEL_COMPLEX,
      messages: [
        { role: "system", content: systemPromptGrading },
        { role: "user", content: userPromptGrading }
      ],
      caller: "aiPipeline:gradeAssessmentAndGenerateCurriculum"
    });

    const result = parseJsonResponse(completionStr);

    return {
      assessmentScore: result.score,
      assessmentFeedback: result.feedback,
      courseData: result.curriculum
    };
  },
});

export const generateLessonContent = action({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const { lesson, chapter, course } = await ctx.runQuery(internal.content.getLessonDetails, {
      lessonId: args.lessonId
    });

    const systemPromptGenerator = await ctx.runQuery(internal.prompts.getPromptContent, { promptId: "content_generator_system" });
    if (!systemPromptGenerator) throw new Error("Prompts not found in DB");

    const lessonPrompt = fillTemplate(systemPromptGenerator, {
      lessonTitle: lesson.title,
      chapterTitle: chapter.title,
      topic: course.topic,
      targetLevel: course.targetLevel
    });

    const textContent = await performNvidiaCall(ctx, {
      model: MODEL_COMPLEX,
      messages: [{ role: "system", content: lessonPrompt }],
      maxTokens: 4096,
      caller: "aiPipeline:generateLessonContent:text"
    });

    const systemPromptExercises = await ctx.runQuery(internal.prompts.getPromptContent, { promptId: "exercise_generator_system" });
    if (!systemPromptExercises) throw new Error("Prompts not found in DB");

    const exercisePrompt = fillTemplate(systemPromptExercises, {
      lessonTitle: lesson.title,
      lessonContext: textContent.substring(0, 1500)
    });

    const exerciseResStr = await performNvidiaCall(ctx, {
      model: MODEL_FAST,
      messages: [{ role: "system", content: exercisePrompt }],
      caller: "aiPipeline:generateLessonContent:exercises"
    });

    let exercises = [];
    if (exerciseResStr) {
      const parsed = parseJsonResponse(exerciseResStr);
      exercises = parsed.exercises || [];
    }

    // 4. Generate TTS Audio with ElevenLabs (if course requested audio)
    let audioStorageId = undefined;
    if (course.modalities.includes("audio")) {
      const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
      if (ELEVENLABS_API_KEY) {
        // Voice: Adam
        const voiceId = "pNInz6obpgDQGcFmaJgB";
        const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: textContent.substring(0, 3000), // ElevenLabs limits text, so taking first 3k chars approx
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5
            }
          })
        });

        if (ttsRes.ok) {
          const audioBlob = await ttsRes.blob();
          audioStorageId = await ctx.storage.store(audioBlob);
        } else {
          console.error("ElevenLabs TTS failed", await ttsRes.text());
        }
      }
    }

    // 5. Save everything back to the database
    await ctx.runMutation(internal.content.saveLessonContent, {
      lessonId: args.lessonId,
      textContent,
      audioStorageId
    });

    if (exercises.length > 0) {
      await ctx.runMutation(internal.content.saveLessonExercises, {
        lessonId: args.lessonId,
        exercises
      });
    }

    return { success: true };
  },
});

export const generateLessonDirect = action({
  args: {
    topic: v.string(),
    targetLevel: v.string(),
    lessonTitle: v.string(),
    chapterTitle: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { topic, targetLevel, lessonTitle, chapterTitle, language = 'English' } = args;

    const systemPromptGenerator = await ctx.runQuery(internal.prompts.getPromptContent, { promptId: "content_generator_system" });
    if (!systemPromptGenerator) throw new Error("Prompts not found in DB");

    const lessonPrompt = fillTemplate(systemPromptGenerator, {
      lessonTitle,
      chapterTitle,
      topic,
      targetLevel,
      language
    });

    const textContent = await performNvidiaCall(ctx, {
      model: MODEL_COMPLEX,
      messages: [{ role: "system", content: lessonPrompt }],
      maxTokens: 4096,
      caller: "aiPipeline:generateLessonDirect:text"
    });

    const systemPromptExercises = await ctx.runQuery(internal.prompts.getPromptContent, { promptId: "exercise_generator_system" });
    if (!systemPromptExercises) throw new Error("Prompts not found in DB");

    const exercisePrompt = fillTemplate(systemPromptExercises, {
      lessonTitle: lessonTitle,
      lessonContext: textContent.substring(0, 1500)
    });

    const exerciseResStr = await performNvidiaCall(ctx, {
      model: MODEL_FAST,
      messages: [{ role: "system", content: exercisePrompt }],
      maxTokens: 2048,
      caller: "aiPipeline:generateLessonDirect:exercises"
    });

    let exercises = [];
    if (exerciseResStr) {
      const parsed = parseJsonResponse(exerciseResStr);
      exercises = parsed.exercises || [];
    }

    return { text: textContent, exercises };
  },
});
