import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { auth } from "./auth";

// ---- Queries ----

export const getUserCourses = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        return await ctx.db
            .query("courses")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();
    },
});

export const getCourseWithChapters = query({
    args: { courseId: v.id("courses") },
    handler: async (ctx, { courseId }) => {
        const course = await ctx.db.get(courseId);
        if (!course) return null;

        const chapters = await ctx.db
            .query("chapters")
            .withIndex("by_course", (q) => q.eq("courseId", courseId))
            .collect();

        const chaptersWithLessons = await Promise.all(
            chapters
                .sort((a, b) => a.orderId - b.orderId)
                .map(async (ch) => {
                    const lessons = await ctx.db
                        .query("lessons")
                        .withIndex("by_chapter", (q) => q.eq("chapterId", ch._id))
                        .collect();
                    return {
                        ...ch,
                        lessons: lessons.sort((a, b) => a.orderId - b.orderId),
                    };
                })
        );

        return { course, chapters: chaptersWithLessons };
    },
});

export const getUserProgress = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        // Get all progress entries for this user — they are indexed by (userId, itemId)
        // We just grab the first 500 to be safe
        const entries = await ctx.db
            .query("progress")
            .withIndex("by_user_item", (q) => q.eq("userId", userId))
            .take(500);

        return entries;
    },
});

// ---- Mutations ----

export const createCourse = mutation({
    args: {
        topic: v.string(),
        targetLevel: v.string(),
        modalities: v.array(v.string()),
        title: v.string(),
        description: v.string(),
        chapters: v.array(
            v.object({
                title: v.string(),
                description: v.optional(v.string()),
                lessons: v.array(
                    v.object({
                        title: v.string(),
                    })
                ),
            })
        ),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const courseId = await ctx.db.insert("courses", {
            userId,
            topic: args.topic,
            targetLevel: args.targetLevel,
            modalities: args.modalities,
            title: args.title,
            description: args.description,
            createdAt: Date.now(),
        });

        for (let ci = 0; ci < args.chapters.length; ci++) {
            const ch = args.chapters[ci];
            const chapterId = await ctx.db.insert("chapters", {
                courseId,
                orderId: ci,
                title: ch.title,
                description: ch.description ?? "",
            });

            for (let li = 0; li < ch.lessons.length; li++) {
                const lessonId = await ctx.db.insert("lessons", {
                    chapterId,
                    orderId: li,
                    title: ch.lessons[li].title,
                    status: "generating",
                });

                // Immediately schedule background generation for this lesson
                await ctx.scheduler.runAfter(
                    1000 + (ci * 3000) + (li * 1000),
                    api.aiPipeline.generateLessonContent,
                    { lessonId }
                );
            }
        }

        return courseId;
    },
});

export const trackCompletion = mutation({
    args: {
        type: v.union(v.literal("lesson"), v.literal("exercise")),
        itemId: v.string(),
        score: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Check if already completed
        const existing = await ctx.db
            .query("progress")
            .withIndex("by_user_item", (q) => q.eq("userId", userId).eq("itemId", args.itemId))
            .first();

        if (existing) return existing._id;

        const progressId = await ctx.db.insert("progress", {
            userId,
            type: args.type,
            itemId: args.itemId,
            completedAt: Date.now(),
            score: args.score,
        });

        // Award XP
        const xpReward = args.type === "lesson" ? 25 : args.score && args.score >= 80 ? 15 : 10;
        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (profile) {
            const now = Date.now();
            const lastActive = profile.lastActiveAt || 0;
            const daysSinceLastActive = Math.floor((now - lastActive) / (24 * 60 * 60 * 1000));

            await ctx.db.patch(profile._id, {
                xp: profile.xp + xpReward,
                streak: daysSinceLastActive <= 1 ? profile.streak + (daysSinceLastActive === 1 ? 1 : 0) : 1,
                lastActiveAt: now,
            });
        }

        return progressId;
    },
});

// Delete a course and all associated data
export const deleteCourse = mutation({
    args: { courseId: v.id("courses") },
    handler: async (ctx, { courseId }) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const course = await ctx.db.get(courseId);
        if (!course || course.userId !== userId) throw new Error("Course not found or not owned by you");

        // Get all chapters
        const chapters = await ctx.db
            .query("chapters")
            .withIndex("by_course", (q) => q.eq("courseId", courseId))
            .collect();

        for (const chapter of chapters) {
            // Get all lessons in this chapter
            const lessons = await ctx.db
                .query("lessons")
                .withIndex("by_chapter", (q) => q.eq("chapterId", chapter._id))
                .collect();

            for (const lesson of lessons) {
                // Delete exercises for this lesson
                const exercises = await ctx.db
                    .query("exercises")
                    .withIndex("by_lesson", (q) => q.eq("lessonId", lesson._id))
                    .collect();
                for (const ex of exercises) {
                    await ctx.db.delete(ex._id);
                }

                // Delete progress for this lesson
                const lessonProgress = await ctx.db
                    .query("progress")
                    .withIndex("by_user_item", (q) => q.eq("userId", userId).eq("itemId", lesson._id))
                    .first();
                if (lessonProgress) await ctx.db.delete(lessonProgress._id);

                await ctx.db.delete(lesson._id);
            }

            await ctx.db.delete(chapter._id);
        }

        await ctx.db.delete(courseId);
    },
});
