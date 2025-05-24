import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function Cart({ onCheckout }: { onCheckout: () => void }) {
  const cartItems = useQuery(api.cart.getCartItems) || [];
  const updateQuantity = useMutation(api.cart.updateCartItemQuantity);
  const removeFromCart = useMutation(api.cart.removeFromCart);

  const validCartItems = cartItems.filter(item => item !== null);

  const totalAmount = validCartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  const handleQuantityChange = async (cartItemId: string, newQuantity: number) => {
    try {
      await updateQuantity({ cartItemId: cartItemId as any, quantity: newQuantity });
    } catch (error) {
      toast.error("Failed to update quantity");
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    try {
      await removeFromCart({ cartItemId: cartItemId as any });
      toast.success("Item removed from cart");
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  if (validCartItems.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-semibold text-primary mb-4">Your Cart</h2>
        <p className="text-gray-500">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-primary mb-4">Your Cart</h2>
      <div className="space-y-4">
        {validCartItems.map((item) => (
          <div key={item._id} className="flex items-center space-x-4 border-b pb-4">
            {item.product?.imageUrl && (
              <img
                src={item.product.imageUrl}
                alt={item.product.name}
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{item.product?.name}</h3>
              <p className="text-sm text-gray-600">
                From: {item.product?.farmer?.name}
              </p>
              <p className="text-primary font-semibold">
                NT${item.product?.price} per {item.product?.unit}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
              >
                -
              </button>
              <span className="w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
              >
                +
              </button>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                NT${((item.product?.price || 0) * item.quantity).toFixed(2)}
              </p>
              <button
                onClick={() => handleRemoveItem(item._id)}
                className="text-red-500 text-sm hover:text-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-semibold">Total: NT${totalAmount.toFixed(2)}</span>
        </div>
        <button
          onClick={onCheckout}
          className="w-full px-4 py-3 bg-primary text-white font-semibold rounded hover:bg-primary-hover"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
