import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
    ...authTables,

    // App-specific user profile data
    userProfiles: defineTable({
        userId: v.string(), // references authTables users._id
        name: v.optional(v.string()),
        role: v.union(v.literal("user"), v.literal("admin")),
        xp: v.number(),
        streak: v.number(),
        lastActiveAt: v.number(),
        stripeCustomerId: v.optional(v.string()),
        plan: v.optional(v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise"))),
    }).index("by_userId", ["userId"]),

    // Generated Courses
    courses: defineTable({
        userId: v.id("users"),
        topic: v.string(), // e.g. "Quantum Physics"
        targetLevel: v.string(), // e.g. "Beginner", "Advanced"
        modalities: v.array(v.string()), // e.g. ["text", "audio", "visual"]
        title: v.string(),
        description: v.string(),
        createdAt: v.number(),
    }).index("by_user", ["userId"]),

    // Chapters within a Course
    chapters: defineTable({
        courseId: v.id("courses"),
        orderId: v.number(),
        title: v.string(),
        description: v.string(),
    }).index("by_course", ["courseId"]),

    // Lessons within a Chapter
    lessons: defineTable({
        chapterId: v.id("chapters"),
        orderId: v.number(),
        title: v.string(),
        // Content is generated lazily when unlocked to save tokens
        status: v.union(v.literal("pending"), v.literal("generating"), v.literal("ready")),

        // Multimodal Content
        textContent: v.optional(v.string()), // The main lesson text
        audioUrl: v.optional(v.string()),    // TTS audio URL (e.g. ElevenLabs)
        imageUrl: v.optional(v.string()),    // SD generated image URL
    }).index("by_chapter", ["chapterId"]),

    // Exercises/Quizzes tied to a Chapter or Lesson
    exercises: defineTable({
        lessonId: v.id("lessons"),
        type: v.union(v.literal("multiple_choice"), v.literal("free_text"), v.literal("audio_response")),
        question: v.string(),
        options: v.optional(v.array(v.string())), // For multiple choice
        correctAnswer: v.string(),
        explanation: v.string(),
    }).index("by_lesson", ["lessonId"]),

    // User Progress tracking
    progress: defineTable({
        userId: v.id("users"),
        type: v.union(v.literal("lesson"), v.literal("exercise")),
        itemId: v.string(), // The string ID to the lesson or exercise
        completedAt: v.number(),
        score: v.optional(v.number()), // 0-100 for exercises
    }).index("by_user_item", ["userId", "itemId"]),

    // AI Prompts (CMS-style like overstay)
    aiPrompts: defineTable({
        promptId: v.string(),
        name: v.string(),
        content: v.string(),
        description: v.string(),
        updatedAt: v.number(),
    }).index("by_prompt_id", ["promptId"]),

    aiLogs: defineTable({
        requestId: v.string(),
        model: v.string(),
        caller: v.string(),
        timestamp: v.number(),
        durationMs: v.number(),
        systemPrompt: v.string(),
        userPromptText: v.string(),
        hasImage: v.boolean(),
        imageSizeBytes: v.optional(v.number()),
        temperature: v.optional(v.number()),
        maxTokens: v.optional(v.number()),
        requestBodySize: v.number(),
        status: v.union(v.literal("success"), v.literal("error")),
        httpStatus: v.number(),
        responseContent: v.string(),
        responseSize: v.number(),
        finishReason: v.optional(v.string()),
        promptTokens: v.optional(v.number()),
        completionTokens: v.optional(v.number()),
        totalTokens: v.optional(v.number()),
        errorMessage: v.optional(v.string()),
    })
        .index("by_timestamp", ["timestamp"])
        .index("by_model_timestamp", ["model", "timestamp"])
        .index("by_caller", ["caller"])
        .index("by_status", ["status"]),

    auditLogs: defineTable({
        action: v.string(),
        category: v.union(v.literal("auth"), v.literal("admin"), v.literal("system"), v.literal("billing")),
        userId: v.optional(v.string()),
        targetId: v.optional(v.string()),
        details: v.string(),
        ipAddress: v.optional(v.string()),
        timestamp: v.number(),
    })
        .index("by_timestamp", ["timestamp"])
        .index("by_category", ["category", "timestamp"])
        .index("by_userId", ["userId", "timestamp"])
        .index("by_action", ["action", "timestamp"]),
});
