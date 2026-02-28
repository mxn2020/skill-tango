import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Plan limits configuration.
 * Free: 3 assessments/mo, 3 courses/mo, text-only.
 * Pro/Enterprise: unlimited.
 */
const PLAN_LIMITS = {
    free: { monthlyAssessments: 3, monthlyCourses: 3, allowAudio: false, allowVisual: false },
    pro: { monthlyAssessments: Infinity, monthlyCourses: Infinity, allowAudio: true, allowVisual: true },
    enterprise: { monthlyAssessments: Infinity, monthlyCourses: Infinity, allowAudio: true, allowVisual: true },
} as const;

type PlanType = keyof typeof PLAN_LIMITS;

function getMonthStart(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

/**
 * Check if the user can perform an action given their plan, and increment usage.
 * Throws if the user exceeds their plan limit.
 */
export const checkAndIncrementUsage = internalMutation({
    args: {
        userId: v.string(),
        action: v.union(v.literal("assessment"), v.literal("course")),
    },
    handler: async (ctx, { userId, action }) => {
        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (!profile) throw new Error("User profile not found");

        const plan = (profile.plan ?? "free") as PlanType;
        const limits = PLAN_LIMITS[plan];

        // Auto-reset monthly counters if past month boundary
        const monthStart = getMonthStart();
        const needsReset = !profile.usageResetAt || profile.usageResetAt < monthStart;

        const currentAssessments = needsReset ? 0 : (profile.monthlyAssessments ?? 0);
        const currentCourses = needsReset ? 0 : (profile.monthlyCoursesCreated ?? 0);

        if (action === "assessment") {
            if (currentAssessments >= limits.monthlyAssessments) {
                throw new Error(
                    `You've reached your monthly limit of ${limits.monthlyAssessments} assessments on the ${plan} plan. Upgrade to continue learning!`
                );
            }
            await ctx.db.patch(profile._id, {
                monthlyAssessments: currentAssessments + 1,
                ...(needsReset ? { monthlyCoursesCreated: 0, usageResetAt: Date.now() } : {}),
            });
        } else {
            if (currentCourses >= limits.monthlyCourses) {
                throw new Error(
                    `You've reached your monthly limit of ${limits.monthlyCourses} courses on the ${plan} plan. Upgrade to create more!`
                );
            }
            await ctx.db.patch(profile._id, {
                monthlyCoursesCreated: currentCourses + 1,
                ...(needsReset ? { monthlyAssessments: 0, usageResetAt: Date.now() } : {}),
            });
        }
    },
});

/**
 * Check if a user's plan allows a specific modality.
 */
export const checkModality = internalQuery({
    args: {
        userId: v.string(),
        modality: v.union(v.literal("audio"), v.literal("visual")),
    },
    handler: async (ctx, { userId, modality }) => {
        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        const plan = (profile?.plan ?? "free") as PlanType;
        const limits = PLAN_LIMITS[plan];

        if (modality === "audio" && !limits.allowAudio) {
            return { allowed: false, reason: "Audio lessons require a Pro plan. Upgrade to unlock!" };
        }
        if (modality === "visual" && !limits.allowVisual) {
            return { allowed: false, reason: "Visual content requires a Pro plan. Upgrade to unlock!" };
        }

        return { allowed: true, reason: null };
    },
});
