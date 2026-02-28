import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { performNvidiaCall, generateImage } from "./nvidia";
import { auth } from "./auth";

const MODEL_FAST = "meta/llama-3.1-8b-instruct";
const MODEL_COMPLEX = "meta/llama-3.1-70b-instruct";

export function fillTemplate(template: string, vars: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] !== undefined ? String(vars[key]) : "");
}

export function sanitizeJson(raw: string): string {
  let s = raw;
  // Remove escaped single quotes (e.g. Don\'t → Don't → then re-escape for valid JSON)
  // The LLM outputs backslash-single-quote which is invalid JSON
  s = s.replace(/\\'/g, "'");
  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, '$1');
  return s;
}

export function parseJsonResponse(raw: string): any {
  let cleaned = raw.trim();
  // Strip markdown code fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  cleaned = sanitizeJson(cleaned);

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
        console.error('[AI Pipeline] Failed to parse extracted JSON:', jsonStr.substring(0, 500), e2);
        throw new Error('AI returned invalid JSON');
      }
    }
    console.error('[AI Pipeline] No JSON object found in response:', cleaned.substring(0, 500));
    throw new Error('AI returned invalid JSON');
  }
}

const MAX_PARSE_RETRIES = 3;

/**
 * Calls the LLM and parses the JSON response, retrying up to 3 times
 * if the response fails to parse as valid JSON.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callAndParseJson(
  ctx: any,
  callArgs: Parameters<typeof performNvidiaCall>[1]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_PARSE_RETRIES; attempt++) {
    const completionStr = await performNvidiaCall(ctx, callArgs);
    try {
      return parseJsonResponse(completionStr);
    } catch (parseErr) {
      lastErr = parseErr;
      if (attempt < MAX_PARSE_RETRIES) {
        console.log(`[AI Pipeline] JSON parse failed on attempt ${attempt}/${MAX_PARSE_RETRIES}, retrying...`);
        continue;
      }
    }
  }
  throw lastErr;
}

export const assessBaseline = action({
  args: {
    topic: v.string(),
    targetLevel: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ assessmentMessage: string; questions: string[] }> => {
    const { topic, targetLevel, language = 'English' } = args;

    // Plan enforcement + rate limiting
    const userId = await auth.getUserId(ctx);
    if (userId) {
      await ctx.runMutation(internal.usageLimits.checkAndIncrementUsage, { userId, action: "assessment" });
      await ctx.runMutation(internal.rateLimit.checkRateLimit, { userId, action: "assessment" });
    }

    const systemPrompt: string | null = await ctx.runQuery(internal.prompts.getPromptContent, { promptId: "assess_baseline_system" });
    const userPromptTpl: string | null = await ctx.runQuery(internal.prompts.getPromptContent, { promptId: "assess_baseline_user" });

    if (!systemPrompt || !userPromptTpl) throw new Error("Prompts not found in DB");

    const userPrompt = fillTemplate(userPromptTpl, { topic, targetLevel, language });

    const result = await callAndParseJson(ctx, {
      model: MODEL_FAST,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      caller: "aiPipeline:assessBaseline"
    });
    return result as { assessmentMessage: string; questions: string[] };
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

    // Plan enforcement + rate limiting
    const userId = await auth.getUserId(ctx);
    if (userId) {
      await ctx.runMutation(internal.usageLimits.checkAndIncrementUsage, { userId, action: "course" });
      await ctx.runMutation(internal.rateLimit.checkRateLimit, { userId, action: "curriculum" });
    }

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

    const result = await callAndParseJson(ctx, {
      model: MODEL_COMPLEX,
      messages: [
        { role: "system", content: systemPromptGrading },
        { role: "user", content: userPromptGrading }
      ],
      caller: "aiPipeline:gradeAssessmentAndGenerateCurriculum"
    });

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
    // Rate limiting
    const userId = await auth.getUserId(ctx);
    if (userId) {
      await ctx.runMutation(internal.rateLimit.checkRateLimit, { userId, action: "lessonGeneration" });
    }

    const { lesson, chapter, course } = await ctx.runQuery(internal.content.getLessonDetails, {
      lessonId: args.lessonId
    });

    // Check audio modality gating
    if (course.modalities.includes("audio") && userId) {
      const audioCheck = await ctx.runQuery(internal.usageLimits.checkModality, { userId, modality: "audio" });
      if (!audioCheck.allowed) {
        console.log(`[AI Pipeline] Audio gated for user ${userId}: ${audioCheck.reason}`);
        // Continue but skip audio generation — don't block the whole lesson
      }
    }

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

    let exercises = [];
    try {
      const parsed = await callAndParseJson(ctx, {
        model: MODEL_FAST,
        messages: [{ role: "system", content: exercisePrompt }],
        caller: "aiPipeline:generateLessonContent:exercises"
      });
      exercises = parsed.exercises || [];
    } catch (err) {
      console.error("[AI Pipeline] Exercise generation failed after retries:", err);
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

    // 4.5 Generate Image (if course requested visual)
    let imageUrl = undefined;
    if (course.modalities.includes("visual")) {
      try {
        const imagePrompt = `An educational illustration for a lesson titled "${lesson.title}" about "${course.topic}". Style: clean, modern, educational vector art, vibrant colors, no text.`;
        const b64 = await generateImage(imagePrompt);
        const binaryString = atob(b64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'image/jpeg' });
        const storageId = await ctx.storage.store(blob);
        imageUrl = await ctx.storage.getUrl(storageId);
      } catch (err) {
        console.error("[AI Pipeline] Failed to generate image:", err);
      }
    }

    // 5. Save everything back to the database
    await ctx.runMutation(internal.content.saveLessonContent, {
      lessonId: args.lessonId,
      textContent,
      audioStorageId,
      imageUrl: imageUrl ?? undefined,
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
    modalities: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { topic, targetLevel, lessonTitle, chapterTitle, language = 'English', modalities = [] } = args;

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

    let exercises = [];
    try {
      const parsed = await callAndParseJson(ctx, {
        model: MODEL_FAST,
        messages: [{ role: "system", content: exercisePrompt }],
        maxTokens: 2048,
        caller: "aiPipeline:generateLessonDirect:exercises"
      });
      exercises = parsed.exercises || [];
    } catch (err) {
      console.error("[AI Pipeline] Exercise generation failed after retries:", err);
    }

    let imageUrl = undefined;
    if (modalities.includes("visual")) {
      try {
        const imagePrompt = `An educational illustration for a lesson titled "${lessonTitle}" about "${topic}". Style: clean, modern, educational vector art, vibrant colors, no text.`;
        const b64 = await generateImage(imagePrompt);
        const binaryString = atob(b64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'image/jpeg' });
        const storageId = await ctx.storage.store(blob);
        imageUrl = await ctx.storage.getUrl(storageId);
      } catch (err) {
        console.error("[AI Pipeline] Failed to generate image:", err);
      }
    }

    return { text: textContent, exercises, imageUrl: imageUrl ?? undefined };
  },
});
