import { mutation } from "./_generated/server";
import { v } from "convex/values";

// This mutation should be called once to set up sample data
export const setupSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if farmers already exist
    const existingFarmers = await ctx.db.query("farmers").collect();
    if (existingFarmers.length > 0) {
      return "Sample data already exists";
    }

    // Add sample farmers
    const farmer1 = await ctx.db.insert("farmers", {
      name: "Chen Wei-Ming",
      bio: "Third-generation organic farmer specializing in heirloom vegetables",
      location: "Taichung County",
      farmSize: "5 hectares",
      specialties: ["Organic vegetables", "Heirloom tomatoes", "Leafy greens"],
      story: "Chen Wei-Ming inherited his family's farm in Taichung County and has been passionate about sustainable farming for over 20 years. He believes that 'ugly' vegetables are just as nutritious and delicious as their perfect-looking counterparts. His farm produces a variety of organic vegetables, and he's particularly proud of his heirloom tomato varieties that come in unique shapes and colors.",
      contactInfo: "Phone: 0912-345-678 | Email: chen.farm@example.com",
      sustainabilityPractices: ["Organic certification", "Water conservation", "Soil health management"],
      certifications: ["Organic Taiwan", "Good Agricultural Practice"],
      totalWastePrevented: 2500,
      rating: 4.8,
      isActive: true,
      joinDate: Date.now() - 365 * 24 * 60 * 60 * 1000, // 1 year ago
    });

    const farmer2 = await ctx.db.insert("farmers", {
      name: "Lin Mei-Hua",
      bio: "Sustainable fruit grower focused on reducing food waste",
      location: "Nantou County",
      farmSize: "3 hectares",
      specialties: ["Citrus fruits", "Stone fruits", "Seasonal berries"],
      story: "Lin Mei-Hua started her farm 15 years ago with a mission to reduce food waste in Taiwan's agricultural sector. She noticed that many perfectly good fruits were being discarded simply because they didn't meet cosmetic standards. Her farm now supplies 'imperfect' fruits that are just as sweet and nutritious as conventional produce, helping to create a more sustainable food system.",
      contactInfo: "Phone: 0923-456-789 | Email: lin.orchard@example.com",
      sustainabilityPractices: ["Integrated pest management", "Renewable energy", "Waste reduction"],
      certifications: ["Sustainable Agriculture", "Carbon Neutral"],
      totalWastePrevented: 1800,
      rating: 4.9,
      isActive: true,
      joinDate: Date.now() - 200 * 24 * 60 * 60 * 1000, // 200 days ago
    });

    const farmer3 = await ctx.db.insert("farmers", {
      name: "Wang Jia-Hong",
      bio: "Young farmer innovating traditional growing methods",
      location: "Yunlin County",
      farmSize: "2 hectares",
      specialties: ["Root vegetables", "Herbs", "Seasonal produce"],
      story: "Wang Jia-Hong represents the new generation of Taiwanese farmers who combine traditional knowledge with modern sustainable practices. At just 28 years old, he's already making a significant impact by growing vegetables that might look different but taste amazing. He's particularly passionate about educating consumers that food quality isn't determined by appearance.",
      contactInfo: "Phone: 0934-567-890 | Email: wang.sustainable@example.com",
      sustainabilityPractices: ["Permaculture", "Companion planting", "Natural fertilizers"],
      certifications: ["Young Farmer Program", "Eco-Friendly"],
      totalWastePrevented: 1200,
      rating: 4.7,
      isActive: true,
      joinDate: Date.now() - 100 * 24 * 60 * 60 * 1000, // 100 days ago
    });

    return `Created sample farmers: ${farmer1}, ${farmer2}, ${farmer3}`;
  },
});

// Make the first user an admin
export const makeFirstUserAdmin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, { role: "admin" });
      return "User promoted to admin";
    } else {
      // Create admin profile
      await ctx.db.insert("userProfiles", {
        userId: args.userId,
        role: "admin",
        name: "Admin User",
        neighborhood: "Taipei",
        sustainabilityScore: 0,
        totalWastePrevented: 0,
        joinDate: Date.now(),
      });
      return "Admin profile created";
    }
  },
});

// Create sample group buying campaign
export const createSampleGroupBuying = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Check if sample campaigns already exist
    const existingCampaigns = await ctx.db.query("groupBuying").collect();
    if (existingCampaigns.length > 0) {
      return "Sample group buying campaigns already exist";
    }

    // Get farmers and products for the campaign
    const farmers = await ctx.db.query("farmers").collect();
    const products = await ctx.db.query("products").collect();

    if (farmers.length === 0 || products.length === 0) {
      return "Please create farmers and products first";
    }

    // Create sample group buying campaign
    const campaignId = await ctx.db.insert("groupBuying", {
      title: "Da'an District Weekly Harvest",
      description: "Join your neighbors for fresh, imperfect produce delivered to our community center every Saturday!",
      organizerId: args.userId,
      neighborhood: "Da'an District",
      targetAmount: 5000,
      currentAmount: 1200,
      participantCount: 8,
      deadline: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week from now
      deliveryDate: Date.now() + 10 * 24 * 60 * 60 * 1000, // 10 days from now
      deliveryLocation: "Da'an Community Center, 123 Xinyi Road",
      status: "active",
      products: products.slice(0, 3).map(product => ({
        productId: product._id,
        discountPercentage: 15,
        minQuantity: 5,
      })),
      hubLevel: "silver",
      inviteCode: "DAAN01",
      impactMetrics: {
        totalWastePrevented: 45,
        carbonSaved: 112,
        participantSavings: 800,
      },
    });

    return `Created sample group buying campaign: ${campaignId}`;
  },
});
