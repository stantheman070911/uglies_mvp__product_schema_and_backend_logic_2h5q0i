import React from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  category: string;
  uglinessGrade: string;
  quantity: number;
  unit: string;
  carbonFootprint?: number;
  discountPercentage?: number;
  farmer: {
    name: string;
    location: string;
    rating?: number;
  } | null;
};

export function ProductCard({ product }: { product: Product }) {
  const addToCart = useMutation(api.cart.addToCart);

  const handleAddToCart = async () => {
    try {
      await addToCart({
        productId: product._id as any,
        quantity: 1,
      });
      toast.success(`Added ${product.name} to cart!`);
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  const getUglinessEmoji = (grade: string) => {
    switch (grade) {
      case "Slightly Quirky": return "😊";
      case "Beautifully Imperfect": return "🤗";
      case "Uniquely Shaped": return "🎨";
      default: return "🥕";
    }
  };

  const originalPrice = product.discountPercentage 
    ? product.price / (1 - product.discountPercentage / 100)
    : product.price * 1.4; // Assume 40% savings as default

  return (
    <div className="border rounded-lg overflow-hidden shadow-lg bg-white flex flex-col hover:shadow-xl transition-shadow">
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
          <span className="text-4xl">🥕</span>
        </div>
      )}
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-semibold text-primary flex-1">{product.name}</h3>
          <span className="text-2xl ml-2">{getUglinessEmoji(product.uglinessGrade)}</span>
        </div>
        
        <p className="text-sm text-gray-600 mb-1">
          From: {product.farmer?.name} ({product.farmer?.location})
          {product.farmer?.rating && (
            <span className="ml-1 text-yellow-500">
              ⭐ {product.farmer.rating.toFixed(1)}
            </span>
          )}
        </p>
        
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs bg-primary-light text-primary px-2 py-1 rounded-full">
            {product.uglinessGrade}
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {product.category}
          </span>
        </div>
        
        <p className="text-sm text-gray-700 mb-3 flex-grow line-clamp-2">{product.description}</p>
        
        <div className="space-y-2 mb-3">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-green-600">
                NT${product.price.toFixed(2)} / {product.unit}
              </span>
              <span className="text-xs text-gray-500 line-through">
                NT${originalPrice.toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Stock: {product.quantity}</p>
              {product.carbonFootprint && (
                <p className="text-xs text-green-600">🌱 {product.carbonFootprint}kg CO₂ saved</p>
              )}
            </div>
          </div>
          
          <div className="bg-green-50 p-2 rounded text-xs text-green-700">
            💰 Save ~{Math.round(((originalPrice - product.price) / originalPrice) * 100)}% vs retail
            <br />
            🌍 Prevents ~0.5kg food waste
          </div>
        </div>
        
        <button
          onClick={handleAddToCart}
          disabled={product.quantity === 0}
          className="w-full px-4 py-2 bg-primary text-white font-semibold rounded hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {product.quantity === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
