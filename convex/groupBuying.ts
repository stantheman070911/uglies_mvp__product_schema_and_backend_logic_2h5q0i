import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Generate unique invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Get active group buying campaigns
export const getActiveGroupBuying = query({
  args: { neighborhood: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("groupBuying")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.gt(q.field("deadline"), Date.now()));

    if (args.neighborhood) {
      query = query.filter((q) => q.eq(q.field("neighborhood"), args.neighborhood));
    }

    const campaigns = await query.collect();

    return Promise.all(
      campaigns.map(async (campaign) => {
        const organizer = await ctx.db.get(campaign.organizerId);
        const organizerProfile = organizer ? await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", organizer._id))
          .unique() : null;

        const productsWithDetails = await Promise.all(
          campaign.products.map(async (p) => {
            const product = await ctx.db.get(p.productId);
            const farmer = product ? await ctx.db.get(product.farmerId) : null;
            return {
              ...p,
              product: product ? {
                ...product,
                farmer,
                imageUrl: await ctx.storage.getUrl(product.imageId),
              } : null,
            };
          })
        );

        return {
          ...campaign,
          organizer: organizerProfile,
          products: productsWithDetails,
        };
      })
    );
  },
});

// Get group buying campaigns by neighborhood
export const getGroupBuyingByNeighborhood = query({
  args: { neighborhood: v.string() },
  handler: async (ctx, args) => {
    const campaigns = await ctx.db
      .query("groupBuying")
      .withIndex("by_neighborhood", (q) => q.eq("neighborhood", args.neighborhood))
      .filter((q) => q.gt(q.field("deadline"), Date.now()))
      .collect();

    return Promise.all(
      campaigns.map(async (campaign) => {
        const organizer = await ctx.db.get(campaign.organizerId);
        const organizerProfile = organizer ? await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", organizer._id))
          .unique() : null;

        const productsWithDetails = await Promise.all(
          campaign.products.map(async (p) => {
            const product = await ctx.db.get(p.productId);
            const farmer = product ? await ctx.db.get(product.farmerId) : null;
            return {
              ...p,
              product: product ? {
                ...product,
                farmer,
                imageUrl: await ctx.storage.getUrl(product.imageId),
              } : null,
            };
          })
        );

        return {
          ...campaign,
          organizer: organizerProfile,
          products: productsWithDetails,
        };
      })
    );
  },
});

// Create group buying campaign
export const createGroupBuying = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    neighborhood: v.string(),
    targetAmount: v.number(),
    deadline: v.number(),
    deliveryDate: v.number(),
    deliveryLocation: v.string(),
    products: v.array(v.object({
      productId: v.id("products"),
      discountPercentage: v.number(),
      minQuantity: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile) throw new Error("User profile not found");

    // Determine hub level based on user history
    const userOrders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    let hubLevel: "bronze" | "silver" | "gold" | "platinum" = "bronze";
    if (userOrders.length > 50) hubLevel = "platinum";
    else if (userOrders.length > 20) hubLevel = "gold";
    else if (userOrders.length > 5) hubLevel = "silver";

    const inviteCode = generateInviteCode();

    return await ctx.db.insert("groupBuying", {
      ...args,
      organizerId: userId,
      currentAmount: 0,
      participantCount: 0,
      status: "active",
      hubLevel,
      inviteCode,
    });
  },
});

// Join group buying campaign
export const joinGroupBuying = mutation({
  args: {
    groupBuyingId: v.id("groupBuying"),
    orderAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const campaign = await ctx.db.get(args.groupBuyingId);
    if (!campaign) throw new Error("Campaign not found");

    if (campaign.deadline < Date.now()) {
      throw new Error("Campaign has expired");
    }

    // Update campaign stats
    const newCurrentAmount = campaign.currentAmount + args.orderAmount;
    const newParticipantCount = campaign.participantCount + 1;
    let newStatus = campaign.status;

    if (newCurrentAmount >= campaign.targetAmount && campaign.status === "active") {
      newStatus = "target_reached";
    }

    await ctx.db.patch(args.groupBuyingId, {
      currentAmount: newCurrentAmount,
      participantCount: newParticipantCount,
      status: newStatus,
    });

    return { success: true, targetReached: newStatus === "target_reached" };
  },
});

// Get group buying campaign by invite code
export const getGroupBuyingByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const campaign = await ctx.db
      .query("groupBuying")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .unique();

    if (!campaign) return null;

    const organizer = await ctx.db.get(campaign.organizerId);
    const organizerProfile = organizer ? await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", organizer._id))
      .unique() : null;

    const productsWithDetails = await Promise.all(
      campaign.products.map(async (p) => {
        const product = await ctx.db.get(p.productId);
        const farmer = product ? await ctx.db.get(product.farmerId) : null;
        return {
          ...p,
          product: product ? {
            ...product,
            farmer,
            imageUrl: await ctx.storage.getUrl(product.imageId),
          } : null,
        };
      })
    );

    return {
      ...campaign,
      organizer: organizerProfile,
      products: productsWithDetails,
    };
  },
});

// Get user's group buying campaigns (as organizer)
export const getUserGroupBuyingCampaigns = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const campaigns = await ctx.db
      .query("groupBuying")
      .withIndex("by_organizer", (q) => q.eq("organizerId", userId))
      .order("desc")
      .collect();

    return Promise.all(
      campaigns.map(async (campaign) => {
        const productsWithDetails = await Promise.all(
          campaign.products.map(async (p) => {
            const product = await ctx.db.get(p.productId);
            return {
              ...p,
              product,
            };
          })
        );

        return {
          ...campaign,
          products: productsWithDetails,
        };
      })
    );
  },
});

// Update group buying status (admin only)
export const updateGroupBuyingStatus = mutation({
  args: {
    groupBuyingId: v.id("groupBuying"),
    status: v.union(
      v.literal("active"),
      v.literal("target_reached"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (userProfile?.role !== "admin") {
      throw new Error("Only admins can update group buying status");
    }

    await ctx.db.patch(args.groupBuyingId, { status: args.status });
  },
});
