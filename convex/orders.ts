import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create order from cart
export const createOrderFromCart = mutation({
  args: {
    deliveryAddress: v.string(),
    notes: v.optional(v.string()),
    deliveryMethod: v.string(), // "individual", "group", "pickup"
    groupBuyingId: v.optional(v.id("groupBuying")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get cart items
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    // Calculate total and prepare order items
    let totalAmount = 0;
    let totalWastePrevented = 0;
    let totalCarbonSaved = 0;
    const orderItems = [];

    for (const cartItem of cartItems) {
      const product = await ctx.db.get(cartItem.productId);
      if (!product || !product.isActive || product.quantity < cartItem.quantity) {
        throw new Error(`Product ${product?.name || 'unknown'} is not available in requested quantity`);
      }

      let itemPrice = product.price;
      
      // Apply group buying discount if applicable
      if (args.groupBuyingId) {
        const groupBuying = await ctx.db.get(args.groupBuyingId);
        if (groupBuying) {
          const groupProduct = groupBuying.products.find(p => p.productId === product._id);
          if (groupProduct) {
            itemPrice = product.price * (1 - groupProduct.discountPercentage / 100);
          }
        }
      }

      const itemTotal = itemPrice * cartItem.quantity;
      totalAmount += itemTotal;

      // Calculate impact metrics (estimated)
      const itemWastePrevented = cartItem.quantity * 0.5; // Assume 0.5kg per item average
      const itemCarbonSaved = itemWastePrevented * 2.5; // 2.5kg CO2e per kg food waste
      totalWastePrevented += itemWastePrevented;
      totalCarbonSaved += itemCarbonSaved;

      orderItems.push({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        priceAtTime: itemPrice,
      });

      // Update product quantity
      await ctx.db.patch(product._id, {
        quantity: product.quantity - cartItem.quantity,
      });
    }

    // Create order
    const orderId = await ctx.db.insert("orders", {
      userId,
      items: orderItems,
      totalAmount,
      status: "pending",
      deliveryAddress: args.deliveryAddress,
      deliveryMethod: args.deliveryMethod,
      groupBuyingId: args.groupBuyingId,
      notes: args.notes,
      impactMetrics: {
        wastePrevented: totalWastePrevented,
        carbonSaved: totalCarbonSaved,
      },
    });

    // Update user impact metrics
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (userProfile) {
      await ctx.db.patch(userProfile._id, {
        totalWastePrevented: (userProfile.totalWastePrevented || 0) + totalWastePrevented,
        sustainabilityScore: (userProfile.sustainabilityScore || 0) + Math.floor(totalWastePrevented * 10),
      });
    }

    // Add impact metrics record
    await ctx.db.insert("impactMetrics", {
      userId,
      date: Date.now(),
      wastePrevented: totalWastePrevented,
      carbonSaved: totalCarbonSaved,
      moneySaved: totalAmount * 0.3, // Assume 30% savings vs retail
      ordersCompleted: 1,
      groupOrdersParticipated: args.groupBuyingId ? 1 : 0,
    });

    // Clear cart
    await Promise.all(
      cartItems.map(item => ctx.db.delete(item._id))
    );

    // Update group buying if applicable
    if (args.groupBuyingId) {
      const groupBuying = await ctx.db.get(args.groupBuyingId);
      if (groupBuying) {
        const newCurrentAmount = groupBuying.currentAmount + totalAmount;
        const newParticipantCount = groupBuying.participantCount + 1;
        let newStatus = groupBuying.status;

        if (newCurrentAmount >= groupBuying.targetAmount && groupBuying.status === "active") {
          newStatus = "target_reached";
        }

        await ctx.db.patch(args.groupBuyingId, {
          currentAmount: newCurrentAmount,
          participantCount: newParticipantCount,
          status: newStatus,
        });
      }
    }

    return orderId;
  },
});

// Get user's orders
export const getUserOrders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return Promise.all(
      orders.map(async (order) => {
        const itemsWithProducts = await Promise.all(
          order.items.map(async (item) => {
            const product = await ctx.db.get(item.productId);
            const farmer = product ? await ctx.db.get(product.farmerId) : null;
            return {
              ...item,
              product: product ? {
                ...product,
                farmer,
                imageUrl: await ctx.storage.getUrl(product.imageId),
              } : null,
            };
          })
        );

        let groupBuying = null;
        if (order.groupBuyingId) {
          groupBuying = await ctx.db.get(order.groupBuyingId);
        }

        return {
          ...order,
          items: itemsWithProducts,
          groupBuying,
        };
      })
    );
  },
});

// Get all orders (admin only)
export const getAllOrders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (userProfile?.role !== "admin") {
      throw new Error("Only admins can view all orders");
    }

    const orders = await ctx.db
      .query("orders")
      .order("desc")
      .collect();

    return Promise.all(
      orders.map(async (order) => {
        const [user, userProfile, itemsWithProducts] = await Promise.all([
          ctx.db.get(order.userId),
          ctx.db
            .query("userProfiles")
            .withIndex("by_user", (q) => q.eq("userId", order.userId))
            .unique(),
          Promise.all(
            order.items.map(async (item) => {
              const product = await ctx.db.get(item.productId);
              const farmer = product ? await ctx.db.get(product.farmerId) : null;
              return {
                ...item,
                product: product ? {
                  ...product,
                  farmer,
                } : null,
              };
            })
          ),
        ]);

        return {
          ...order,
          user: userProfile,
          items: itemsWithProducts,
        };
      })
    );
  },
});

// Update order status (admin only)
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("delivered"),
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
      throw new Error("Only admins can update order status");
    }

    await ctx.db.patch(args.orderId, { status: args.status });

    // Create notification for user
    const order = await ctx.db.get(args.orderId);
    if (order) {
      await ctx.db.insert("notifications", {
        userId: order.userId,
        type: "order_update",
        title: "Order Status Updated",
        message: `Your order status has been updated to: ${args.status}`,
        isRead: false,
        createdAt: Date.now(),
        relatedId: args.orderId,
      });
    }
  },
});

// Get platform impact metrics (admin only)
export const getPlatformImpactMetrics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (userProfile?.role !== "admin") {
      throw new Error("Only admins can view platform metrics");
    }

    const allMetrics = await ctx.db.query("impactMetrics").collect();
    const allOrders = await ctx.db.query("orders").collect();
    const allUsers = await ctx.db.query("userProfiles").collect();

    const totalMetrics = allMetrics.reduce(
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
      totalMetrics,
      totalUsers: allUsers.length,
      totalOrders: allOrders.length,
      averageOrderValue: allOrders.length > 0 
        ? allOrders.reduce((sum, order) => sum + order.totalAmount, 0) / allOrders.length 
        : 0,
    };
  },
});
