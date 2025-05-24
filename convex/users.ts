import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get current user profile
export const getCurrentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return profile;
  },
});

// Create or update user profile
export const createOrUpdateProfile = mutation({
  args: {
    name: v.string(),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    neighborhood: v.string(),
    preferences: v.optional(v.object({
      categories: v.array(v.string()),
      uglinessGrades: v.array(v.string()),
      deliveryPreference: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        name: args.name,
        address: args.address,
        phone: args.phone,
        neighborhood: args.neighborhood,
        preferences: args.preferences,
      });
      return existingProfile._id;
    } else {
      return await ctx.db.insert("userProfiles", {
        userId,
        role: "user", // Default role
        name: args.name,
        address: args.address,
        phone: args.phone,
        neighborhood: args.neighborhood,
        sustainabilityScore: 0,
        totalWastePrevented: 0,
        joinDate: Date.now(),
        preferences: args.preferences,
      });
    }
  },
});

// Check if user is admin
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return profile?.role === "admin";
  },
});

// Get user impact metrics
export const getUserImpactMetrics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) return null;

    // Get recent impact metrics
    const recentMetrics = await ctx.db
      .query("impactMetrics")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(30); // Last 30 entries

    const totalMetrics = recentMetrics.reduce(
      (acc, metric) => ({
        wastePrevented: acc.wastePrevented + metric.wastePrevented,
        carbonSaved: acc.carbonSaved + metric.carbonSaved,
        moneySaved: acc.moneySaved + metric.moneySaved,
        ordersCompleted: acc.ordersCompleted + metric.ordersCompleted,
        groupOrdersParticipated: acc.groupOrdersParticipated + metric.groupOrdersParticipated,
      }),
      {
        wastePrevented: 0,
        carbonSaved: 0,
        moneySaved: 0,
        ordersCompleted: 0,
        groupOrdersParticipated: 0,
      }
    );

    return {
      profile,
      totalMetrics,
      recentMetrics,
    };
  },
});

// Update user sustainability score
export const updateSustainabilityScore = mutation({
  args: {
    userId: v.id("users"),
    scoreIncrease: v.number(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) throw new Error("User profile not found");

    const newScore = (profile.sustainabilityScore || 0) + args.scoreIncrease;

    await ctx.db.patch(profile._id, {
      sustainabilityScore: newScore,
    });

    return newScore;
  },
});

// Get neighborhood leaderboard
export const getNeighborhoodLeaderboard = query({
  args: { neighborhood: v.string() },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_neighborhood", (q) => q.eq("neighborhood", args.neighborhood))
      .collect();

    const leaderboard = profiles
      .filter(p => p.sustainabilityScore && p.sustainabilityScore > 0)
      .sort((a, b) => (b.sustainabilityScore || 0) - (a.sustainabilityScore || 0))
      .slice(0, 10)
      .map(p => ({
        name: p.name,
        sustainabilityScore: p.sustainabilityScore || 0,
        totalWastePrevented: p.totalWastePrevented || 0,
      }));

    return leaderboard;
  },
});

// Promote user to admin (only existing admins can do this)
export const promoteToAdmin = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentUserProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (currentUserProfile?.role !== "admin") {
      throw new Error("Only admins can promote users");
    }

    const targetProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .unique();

    if (!targetProfile) {
      throw new Error("Target user profile not found");
    }

    await ctx.db.patch(targetProfile._id, { role: "admin" });
  },
});

// Get all neighborhoods
export const getNeighborhoods = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("userProfiles").collect();
    const neighborhoods = [...new Set(profiles.map(p => p.neighborhood))];
    return neighborhoods.filter(Boolean).sort();
  },
});
