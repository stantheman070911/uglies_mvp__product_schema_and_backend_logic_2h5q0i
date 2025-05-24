import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Generate upload URL for product images (admin only)
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (userProfile?.role !== "admin") {
      throw new Error("Only admins can upload product images");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

// Add new product (admin only)
export const addProduct = mutation({
  args: {
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
    nutritionalInfo: v.optional(v.string()),
    storageInstructions: v.optional(v.string()),
    recipeSuggestions: v.optional(v.array(v.string())),
    carbonFootprint: v.optional(v.number()),
    discountPercentage: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (userProfile?.role !== "admin") {
      throw new Error("Only admins can add products");
    }

    return await ctx.db.insert("products", {
      ...args,
      isActive: true,
    });
  },
});

// List active products with farmer info and enhanced details
export const listActiveProducts = query({
  args: {
    category: v.optional(v.string()),
    uglinessGrade: v.optional(v.string()),
    neighborhood: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .filter((q) => q.gt(q.field("quantity"), 0));

    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }

    if (args.uglinessGrade) {
      query = query.filter((q) => q.eq(q.field("uglinessGrade"), args.uglinessGrade));
    }

    const products = await query.order("desc").collect();

    return Promise.all(
      products.map(async (product) => {
        const [imageUrl, farmer] = await Promise.all([
          ctx.storage.getUrl(product.imageId),
          ctx.db.get(product.farmerId),
        ]);

        return {
          ...product,
          imageUrl,
          farmer,
        };
      })
    );
  },
});

// Get products by farmer
export const getProductsByFarmer = query({
  args: { farmerId: v.id("farmers") },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_farmer", (q) => q.eq("farmerId", args.farmerId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return Promise.all(
      products.map(async (product) => {
        const imageUrl = await ctx.storage.getUrl(product.imageId);
        return {
          ...product,
          imageUrl,
        };
      })
    );
  },
});

// Get product by ID with farmer info
export const getProductById = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;

    const [imageUrl, farmer] = await Promise.all([
      ctx.storage.getUrl(product.imageId),
      ctx.db.get(product.farmerId),
    ]);

    return {
      ...product,
      imageUrl,
      farmer,
    };
  },
});

// Get product categories
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const categories = [...new Set(products.map(p => p.category))];
    return categories.sort();
  },
});

// Get ugliness grades
export const getUglinessGrades = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const grades = [...new Set(products.map(p => p.uglinessGrade))];
    return grades.sort();
  },
});

// Update product quantity (for order processing)
export const updateProductQuantity = mutation({
  args: {
    productId: v.id("products"),
    quantityChange: v.number(), // negative for decrease, positive for increase
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    const newQuantity = product.quantity + args.quantityChange;
    if (newQuantity < 0) throw new Error("Insufficient quantity");

    await ctx.db.patch(args.productId, {
      quantity: newQuantity,
    });

    return newQuantity;
  },
});
