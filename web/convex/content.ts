import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getLessonDetails = internalQuery({
    args: { lessonId: v.id("lessons") },
    handler: async (ctx, args) => {
        const lesson = await ctx.db.get(args.lessonId);
        if (!lesson) throw new Error("Lesson not found");

        const chapter = await ctx.db.get(lesson.chapterId);
        if (!chapter) throw new Error("Chapter not found");

        const course = await ctx.db.get(chapter.courseId);
        if (!course) throw new Error("Course not found");

        return { lesson, chapter, course };
    },
});

export const saveLessonContent = internalMutation({
    args: {
        lessonId: v.id("lessons"),
        textContent: v.string(),
        audioStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        let audioUrl = undefined;
        if (args.audioStorageId) {
            audioUrl = await ctx.storage.getUrl(args.audioStorageId);
        }

        await ctx.db.patch(args.lessonId, {
            textContent: args.textContent,
            audioUrl: audioUrl ?? undefined,
            status: "ready",
        });
    },
});

export const saveLessonExercises = internalMutation({
    args: {
        lessonId: v.id("lessons"),
        exercises: v.array(
            v.object({
                type: v.union(v.literal("multiple_choice"), v.literal("free_text"), v.literal("audio_response")),
                question: v.string(),
                options: v.optional(v.array(v.string())),
                correctAnswer: v.string(),
                explanation: v.string(),
            })
        ),
    },
    handler: async (ctx, args) => {
        for (const ex of args.exercises) {
            await ctx.db.insert("exercises", {
                lessonId: args.lessonId,
                type: ex.type,
                question: ex.question,
                options: ex.options,
                correctAnswer: ex.correctAnswer,
                explanation: ex.explanation,
            });
        }
    },
});
