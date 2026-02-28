import { action, mutation, internalMutation, query, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { auth } from "./auth";

// ---- Helpers ----

/** Create or retrieve a Stripe Customer for the authenticated user. */
async function createOrGetCustomer(
    stripeKey: string,
    userId: string,
    email?: string,
    existingCustomerId?: string,
): Promise<string> {
    if (existingCustomerId) return existingCustomerId;

    const params = new URLSearchParams({
        "metadata[app]": "skill-tango",
        "metadata[userId]": userId,
    });
    if (email) params.set("email", email);

    const response = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${stripeKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Stripe customer creation failed: ${error}`);
    }

    const customer = await response.json();
    return customer.id;
}

// ---- Internal Queries (for webhook handlers) ----

export const getProfileByStripeCustomerId = internalQuery({
    args: { stripeCustomerId: v.string() },
    handler: async (ctx, { stripeCustomerId }) => {
        return await ctx.db
            .query("userProfiles")
            .filter((q) => q.eq(q.field("stripeCustomerId"), stripeCustomerId))
            .first();
    },
});

// ---- Queries ----

export const getSubscription = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (!profile) return null;

        return {
            plan: profile.plan ?? "free",
            stripeCustomerId: profile.stripeCustomerId,
        };
    },
});

// ---- Mutations ----

export const updateSubscription = mutation({
    args: {
        stripeCustomerId: v.string(),
        plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    },
    handler: async (ctx, { stripeCustomerId, plan }) => {
        const profile = await ctx.db
            .query("userProfiles")
            .filter((q) => q.eq(q.field("stripeCustomerId"), stripeCustomerId))
            .first();

        if (profile) {
            await ctx.db.patch(profile._id, { plan });
        }
    },
});

// Store Stripe customer ID on user profile (internal — called from checkout actions)
export const setStripeCustomerId = internalMutation({
    args: {
        customerId: v.string(),
        userId: v.string(),
    },
    handler: async (ctx, { customerId, userId }) => {
        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (profile) {
            await ctx.db.patch(profile._id, { stripeCustomerId: customerId });
        }
    },
});

// Internal mutation: atomically activate subscription (create profile if needed + set plan)
export const activateSubscription = internalMutation({
    args: {
        userId: v.string(),
        stripeCustomerId: v.string(),
        plan: v.union(v.literal("pro"), v.literal("enterprise")),
    },
    handler: async (ctx, { userId, stripeCustomerId, plan }) => {
        let profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (!profile) {
            console.log(`[activateSubscription] No profile for userId=${userId}, creating one...`);
            const profileId = await ctx.db.insert("userProfiles", {
                userId,
                name: "",
                role: "user",
                xp: 0,
                streak: 0,
                lastActiveAt: Date.now(),
                plan,
                stripeCustomerId,
            });
            console.log(`[activateSubscription] Created profile ${profileId} with plan=${plan}`);
            return;
        }

        console.log(`[activateSubscription] Updating profile ${profile._id} → plan=${plan}`);
        await ctx.db.patch(profile._id, {
            plan,
            stripeCustomerId,
        });
        console.log(`[activateSubscription] Done.`);
    },
});

// ---- Actions ----

// Create a Stripe Checkout Session for subscription
export const createCheckoutSession = action({
    args: {
        plan: v.union(v.literal("pro"), v.literal("enterprise")),
    },
    handler: async (ctx, { plan }) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

        const priceEnvVar = plan === "pro" ? "STRIPE_PRICE_PRO" : "STRIPE_PRICE_ENTERPRISE";
        const priceId = process.env[priceEnvVar];
        if (!priceId) throw new Error(`${priceEnvVar} not configured`);

        const siteUrl = process.env.SITE_URL ?? "http://localhost:5173";

        // Get existing profile for customer ID
        const profile = await ctx.runQuery(internal.users.getProfileByUserId, { userId });
        const customerId = await createOrGetCustomer(
            stripeKey, userId, undefined, profile?.stripeCustomerId ?? undefined,
        );

        // Save customer ID if new
        if (!profile?.stripeCustomerId) {
            await ctx.runMutation(internal.stripe.setStripeCustomerId, { customerId, userId });
        }

        const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${stripeKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                "mode": "subscription",
                "customer": customerId,
                "success_url": `${siteUrl}/pricing?success=true`,
                "cancel_url": `${siteUrl}/pricing?canceled=true`,
                "line_items[0][price]": priceId,
                "line_items[0][quantity]": "1",
                "metadata[app]": "skill-tango",
                "metadata[userId]": userId,
                "metadata[plan]": plan,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Stripe error: ${error}`);
        }

        const session = await response.json();
        return { url: session.url };
    },
});

// Create a Stripe Customer Portal session (manage subscription, payment methods)
export const createPortalSession = action({
    args: {},
    handler: async (ctx): Promise<{ url: string }> => {
        const userId: string | null = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const stripeKey: string | undefined = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

        const siteUrl: string = process.env.SITE_URL ?? "http://localhost:5173";

        const profile: { stripeCustomerId?: string } | null = await ctx.runQuery(
            internal.users.getProfileByUserId, { userId }
        );
        if (!profile?.stripeCustomerId) {
            throw new Error("No Stripe customer found. Subscribe first.");
        }

        const portalResponse: globalThis.Response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${stripeKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                customer: profile.stripeCustomerId,
                return_url: `${siteUrl}/billing`,
            }),
        });

        if (!portalResponse.ok) {
            const errorText: string = await portalResponse.text();
            throw new Error(`Stripe Portal error: ${errorText}`);
        }

        const portalSession: { url: string } = await portalResponse.json();
        return { url: portalSession.url };
    },
});

// Handle subscription activation (called from webhook)
export const handleSubscriptionActive = action({
    args: {
        userId: v.string(),
        stripeCustomerId: v.string(),
        plan: v.union(v.literal("pro"), v.literal("enterprise")),
    },
    handler: async (ctx, { userId, stripeCustomerId, plan }) => {
        console.log(`[handleSubscriptionActive] userId=${userId}, customerId=${stripeCustomerId}, plan=${plan}`);
        await ctx.runMutation(internal.stripe.activateSubscription, {
            userId,
            stripeCustomerId,
            plan,
        });
        console.log(`[handleSubscriptionActive] Done`);
    },
});
