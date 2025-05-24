import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User profiles with enhanced features
  userProfiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("user"), v.literal("farmer")),
    name: v.string(),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    neighborhood: v.string(),
    sustainabilityScore: v.optional(v.number()),
    totalWastePrevented: v.optional(v.number()), // in kg
    joinDate: v.number(),
    preferences: v.optional(v.object({
      categories: v.array(v.string()),
      uglinessGrades: v.array(v.string()),
      deliveryPreference: v.string(),
    })),
  }).index("by_user", ["userId"])
    .index("by_neighborhood", ["neighborhood"]),

  // Enhanced farmer profiles for storytelling
  farmers: defineTable({
    name: v.string(),
    bio: v.string(),
    location: v.string(),
    farmSize: v.optional(v.string()),
    specialties: v.array(v.string()),
    story: v.string(),
    imageId: v.optional(v.id("_storage")),
    contactInfo: v.optional(v.string()),
    sustainabilityPractices: v.array(v.string()),
    certifications: v.optional(v.array(v.string())),
    totalWastePrevented: v.optional(v.number()),
    rating: v.optional(v.number()),
    isActive: v.boolean(),
    joinDate: v.number(),
  }),

  // Enhanced products table
  products: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    imageId: v.id("_storage"),
    farmerId: v.id("farmers"),
    category: v.string(),
    uglinessGrade: v.string(),
    quantity: v.number(),
    unit: v.string(),
    harvestDate: v.optional(v.number()),
    expiryDate: v.optional(v.number()),
    isActive: v.boolean(),
    nutritionalInfo: v.optional(v.string()),
    storageInstructions: v.optional(v.string()),
    recipeSuggestions: v.optional(v.array(v.string())),
    carbonFootprint: v.optional(v.number()),
    discountPercentage: v.optional(v.number()),
  })
    .index("by_category", ["category"])
    .index("by_farmer", ["farmerId"])
    .index("by_active", ["isActive"])
    .index("by_ugliness_grade", ["uglinessGrade"]),

  // Orders system with enhanced tracking
  orders: defineTable({
    userId: v.id("users"),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      priceAtTime: v.number(),
    })),
    totalAmount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    deliveryAddress: v.string(),
    deliveryDate: v.optional(v.number()),
    groupBuyingId: v.optional(v.id("groupBuying")),
    notes: v.optional(v.string()),
    impactMetrics: v.optional(v.object({
      wastePrevented: v.number(),
      carbonSaved: v.number(),
    })),
    deliveryMethod: v.string(), // "individual", "group", "pickup"
    trackingNumber: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_group_buying", ["groupBuyingId"]),

  // Enhanced group buying functionality
  groupBuying: defineTable({
    title: v.string(),
    description: v.string(),
    organizerId: v.id("users"),
    neighborhood: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    participantCount: v.number(),
    deadline: v.number(),
    deliveryDate: v.number(),
    deliveryLocation: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("target_reached"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    products: v.array(v.object({
      productId: v.id("products"),
      discountPercentage: v.number(),
      minQuantity: v.number(),
    })),
    hubLevel: v.union(
      v.literal("bronze"),
      v.literal("silver"),
      v.literal("gold"),
      v.literal("platinum")
    ),
    impactMetrics: v.optional(v.object({
      totalWastePrevented: v.number(),
      carbonSaved: v.number(),
      participantSavings: v.number(),
    })),
    inviteCode: v.string(),
  })
    .index("by_neighborhood", ["neighborhood"])
    .index("by_status", ["status"])
    .index("by_organizer", ["organizerId"])
    .index("by_invite_code", ["inviteCode"]),

  // Shopping cart with enhanced features
  cartItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
    addedAt: v.number(),
    groupBuyingId: v.optional(v.id("groupBuying")),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_product", ["userId", "productId"]),

  // Subscription management
  subscriptions: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("basic"), v.literal("plus"), v.literal("premium")),
    frequency: v.union(v.literal("weekly"), v.literal("biweekly"), v.literal("monthly")),
    preferences: v.object({
      categories: v.array(v.string()),
      uglinessGrades: v.array(v.string()),
      maxBudget: v.number(),
    }),
    isActive: v.boolean(),
    nextDelivery: v.number(),
    totalDeliveries: v.number(),
  }).index("by_user", ["userId"])
    .index("by_active", ["isActive"]),

  // Impact tracking
  impactMetrics: defineTable({
    userId: v.id("users"),
    date: v.number(),
    wastePrevented: v.number(), // kg
    carbonSaved: v.number(), // kg CO2e
    moneySaved: v.number(), // NT$
    ordersCompleted: v.number(),
    groupOrdersParticipated: v.number(),
  }).index("by_user", ["userId"])
    .index("by_date", ["date"]),

  // Recipe sharing and content
  recipes: defineTable({
    title: v.string(),
    description: v.string(),
    ingredients: v.array(v.string()),
    instructions: v.array(v.string()),
    authorId: v.id("users"),
    imageId: v.optional(v.id("_storage")),
    categories: v.array(v.string()),
    uglinessGrades: v.array(v.string()),
    prepTime: v.number(), // minutes
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    likes: v.number(),
    isPublic: v.boolean(),
  }).index("by_author", ["authorId"])
    .index("by_category", ["categories"])
    .index("by_public", ["isPublic"]),

  // Farmer stories and content
  farmerStories: defineTable({
    farmerId: v.id("farmers"),
    title: v.string(),
    content: v.string(),
    imageId: v.optional(v.id("_storage")),
    videoId: v.optional(v.id("_storage")),
    publishDate: v.number(),
    tags: v.array(v.string()),
    isPublished: v.boolean(),
  }).index("by_farmer", ["farmerId"])
    .index("by_published", ["isPublished"]),

  // Notifications system
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("order_update"),
      v.literal("group_buying"),
      v.literal("new_product"),
      v.literal("farmer_story"),
      v.literal("impact_milestone")
    ),
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
    relatedId: v.optional(v.string()), // order ID, group buying ID, etc.
  }).index("by_user", ["userId"])
    .index("by_unread", ["userId", "isRead"]),

  // Loyalty program
  loyaltyPoints: defineTable({
    userId: v.id("users"),
    points: v.number(),
    totalEarned: v.number(),
    totalSpent: v.number(),
    tier: v.union(
      v.literal("bronze"),
      v.literal("silver"),
      v.literal("gold"),
      v.literal("platinum")
    ),
  }).index("by_user", ["userId"]),

  // Point transactions
  pointTransactions: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("earned"), v.literal("spent")),
    amount: v.number(),
    reason: v.string(),
    orderId: v.optional(v.id("orders")),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
