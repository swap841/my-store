'use client';

import React, { useEffect, useState } from 'react';
import { useCart } from './CartContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { getAuth, User, onAuthStateChanged } from 'firebase/auth';
import { app } from '@/firebaseConfig';

// Initialize Firebase auth
const auth = getAuth(app);

const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    cartItems,
    closeCart,
    removeFromCart,
    updateQuantity,
    totalItems,
    subtotal,
    deliveryCharge,
    handlingCharge,
    smallCartCharge,
    grandTotal,
  } = useCart();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCheckout = () => {
    closeCart();
    router.push('/checkout');
  };

  // Google sign-in from cart drawer
  const handleGoogleSignIn = async () => {
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      closeCart();
    } catch (err) {
      console.log("Login Error:", err);
    }
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-xl z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">My Cart</h2>
            <p className="text-sm text-gray-600">{totalItems} items</p>
          </div>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-lg">Your cart is empty</p>
              <p className="text-sm mt-1">Add items to get started</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4">
                {cartItems.map(item => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="relative w-20 h-20">
                      <Image
                        src={item.imageUrl || '/images/placeholder.png'}
                        alt={item.name}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-green-600 font-semibold">
                        ₹{item.price}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="w-8 h-8 border rounded-full"
                        >
                          −
                        </button>
                        <span className="w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="w-8 h-8 border rounded-full"
                        >
                          +
                        </button>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="ml-3 text-sm text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div className="mt-8">
                <h3 className="font-bold text-lg mb-4">Bill details</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Items total</span>
                    <span>₹{subtotal}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Delivery charge</span>
                    {deliveryCharge === 0 ? (
                      <span className="flex gap-2">
                        <span className="line-through text-gray-400">₹25</span>
                        <span className="text-blue-600 font-semibold">
                          FREE
                        </span>
                      </span>
                    ) : (
                      <span>₹{deliveryCharge}</span>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <span>Handling charge</span>
                    <span>₹{handlingCharge}</span>
                  </div>

                  {smallCartCharge > 0 && (
                    <div className="flex justify-between">
                      <span>Small cart charge</span>
                      <span>₹{smallCartCharge}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-lg pt-4 border-t mt-4">
                    <span>Grand total</span>
                    <span>₹{grandTotal}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Checkout/Sign In Button */}
        {cartItems.length > 0 && !loading && (
          <div className="p-6 border-t">
            {user ? (
              // User is signed in - show checkout button
              <button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                PROCEED TO CHECKOUT
              </button>
            ) : (
              // User is not signed in - show sign in options
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">
                  Please sign in to proceed with checkout
                </p>
                
                                {/* Alternative Sign In Button */}
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  SIGN IN TO CHECKOUT
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading state */}
        {cartItems.length > 0 && loading && (
          <div className="p-6 border-t">
            <div className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold text-center">
              Loading...
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;