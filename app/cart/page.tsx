"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/src/lib/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

interface CartItem {
  id: string; // Document ID in cart collection
  productId: string; // Original product ID from products collection
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  description?: string; // Added
  weight?: number; // Added
}

export default function Cart() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch cart items from Firestore
  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "cart"));
      const items = snapshot.docs.map((docItem) => {
        const data = docItem.data();
        return {
          id: docItem.id, // Firestore document ID in cart collection
          productId: data.id || "", // Original product ID from products collection
          name: data.name || "",
          price: data.price || 0,
          quantity: data.quantity || 1,
          imageUrl: data.imageUrl || null, // Changed from 'image' to 'imageUrl'
          description: data.description || "", // Added
          weight: data.weight || 0, // Added
        };
      });
      setCartItems(items);
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  // Update quantity
  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return;

    const productRef = doc(db, "cart", id);
    await updateDoc(productRef, { quantity });

    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  // Remove item
  const removeItem = async (id: string) => {
    const productRef = doc(db, "cart", id);
    await deleteDoc(productRef);

    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear entire cart
  const clearCart = async () => {
    try {
      const snapshot = await getDocs(collection(db, "cart"));
      const deletePromises = snapshot.docs.map((docItem) => 
        deleteDoc(doc(db, "cart", docItem.id))
      );
      await Promise.all(deletePromises);
      setCartItems([]);
    } catch (err) {
      console.error("Error clearing cart:", err);
    }
  };

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Calculate total items
  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // Calculate total weight
  const totalWeight = cartItems.reduce(
    (total, item) => total + (item.weight || 0) * item.quantity,
    0
  );

  if (loading) return <p className="text-center mt-10">Loading cart...</p>;

  return (
    <div className="max-w-6xl mx-auto p-4 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Your Shopping Cart</h1>
        <button
          onClick={() => router.push("/products")}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          Continue Shopping
        </button>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-xl text-gray-600 mb-4">Your cart is empty</p>
          <button
            onClick={() => router.push("/products")}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Cart Items */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-lg shadow">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-center justify-between border-b p-4 hover:bg-gray-50 transition"
                >
                  {/* Product Image */}
                  <div className="flex items-center space-x-4 mb-4 sm:mb-0 sm:w-1/3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/100";
                          e.currentTarget.onerror = null;
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 flex items-center justify-center rounded-lg">
                        <span className="text-gray-500">No Image</span>
                      </div>
                    )}
                    <div>
                      <h2 className="font-semibold text-lg">{item.name}</h2>
                      {item.description && (
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {item.description}
                        </p>
                      )}
                      {item.weight && (
                        <p className="text-sm text-gray-500">
                          Weight: {item.weight}g
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price and Quantity Controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between w-full sm:w-2/3 space-y-4 sm:space-y-0">
                    <div className="text-center sm:text-left">
                      <p className="text-lg font-semibold">₹{item.price}</p>
                      <p className="text-sm text-gray-500">per item</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-gray-100 transition"
                        disabled={item.quantity <= 1}
                      >
                        <span className="text-lg">−</span>
                      </button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-gray-100 transition"
                      >
                        <span className="text-lg">+</span>
                      </button>
                    </div>

                    <div className="text-center sm:text-right">
                      <p className="text-xl font-bold">₹{item.price * item.quantity}</p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 text-sm mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Clear Cart Button */}
            <div className="mt-4 text-right">
              <button
                onClick={clearCart}
                className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition"
              >
                Clear Entire Cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items ({totalItems})</span>
                  <span>₹{totalPrice}</span>
                </div>
                
                {totalWeight > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Weight</span>
                    <span>{totalWeight}g</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>₹{totalPrice}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-lg"
                onClick={() => router.push("/checkout")}
              >
                Proceed to Checkout
              </button>

              {/* Additional Info */}
              <div className="mt-6 text-sm text-gray-500">
                <p>• Free shipping on orders over ₹1000</p>
                <p>• 30-day return policy</p>s
                <p>• Secure payment</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}