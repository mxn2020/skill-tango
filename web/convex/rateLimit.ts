import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Simple token-bucket rate limiter using the rateLimits table.
 * Per-user, per-action limits.
 */

const RATE_LIMITS: Record<string, { maxTokens: number; refillPerSecond: number }> = {
    assessment: { maxTokens: 10, refillPerSecond: 0.05 },      // ~3/min burst, refills slowly
    curriculum: { maxTokens: 5, refillPerSecond: 0.03 },        // ~5 burst, slower refill
    lessonGeneration: { maxTokens: 20, refillPerSecond: 0.1 },  // ~20 burst, moderate refill
};

export const checkRateLimit = internalMutation({
    args: {
        userId: v.string(),
        action: v.string(),
    },
    handler: async (ctx, { userId, action }) => {
        const config = RATE_LIMITS[action];
        if (!config) return; // No limit configured for this action

        const key = `${userId}:${action}`;
        const existing = await ctx.db
            .query("rateLimits")
            .withIndex("by_key", (q) => q.eq("key", key))
            .first();

        const now = Date.now();

        if (!existing) {
            // First request — create bucket with one token consumed
            await ctx.db.insert("rateLimits", {
                key,
                tokens: config.maxTokens - 1,
                lastRefill: now,
            });
            return;
        }

        // Refill tokens based on elapsed time
        const elapsed = (now - existing.lastRefill) / 1000;
        const refilled = Math.min(
            config.maxTokens,
            existing.tokens + elapsed * config.refillPerSecond
        );

        if (refilled < 1) {
            throw new Error(
                `Rate limit exceeded for ${action}. Please wait a moment before trying again.`
            );
        }

        await ctx.db.patch(existing._id, {
            tokens: refilled - 1,
            lastRefill: now,
        });
    },
});
