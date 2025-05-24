import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all farmers
export const listFarmers = query({
  args: {},
  handler: async (ctx) => {
    const farmers = await ctx.db.query("farmers").collect();
    
    return Promise.all(
      farmers.map(async (farmer) => {
        const imageUrl = farmer.imageId 
          ? await ctx.storage.getUrl(farmer.imageId)
          : null;
        return {
          ...farmer,
          imageUrl,
        };
      })
    );
  },
});

// Get farmer by ID
export const getFarmerById = query({
  args: { farmerId: v.id("farmers") },
  handler: async (ctx, args) => {
    const farmer = await ctx.db.get(args.farmerId);
    if (!farmer) return null;

    const imageUrl = farmer.imageId 
      ? await ctx.storage.getUrl(farmer.imageId)
      : null;

    return {
      ...farmer,
      imageUrl,
    };
  },
});

// Add new farmer (admin only)
export const addFarmer = mutation({
  args: {
    name: v.string(),
    bio: v.string(),
    location: v.string(),
    farmSize: v.optional(v.string()),
    specialties: v.array(v.string()),
    story: v.string(),
    imageId: v.optional(v.id("_storage")),
    contactInfo: v.optional(v.string()),
    sustainabilityPractices: v.optional(v.array(v.string())),
    certifications: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is admin
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (userProfile?.role !== "admin") {
      throw new Error("Only admins can add farmers");
    }

    return await ctx.db.insert("farmers", {
      ...args,
      sustainabilityPractices: args.sustainabilityPractices || [],
      isActive: true,
      joinDate: Date.now(),
    });
  },
});

// Generate upload URL for farmer images
export const generateFarmerImageUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (userProfile?.role !== "admin") {
      throw new Error("Only admins can upload farmer images");
    }

    return await ctx.storage.generateUploadUrl();
  },
});
