'use client';

import React from 'react';
import { useCart } from '@/components/CartContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const Cart: React.FC = () => {
  const {
    isCartOpen,
    cartItems,
    closeCart, // Use closeCart instead of toggleCart
    removeFromCart,
    updateQuantity,
    totalItems,
    subtotal,
    deliveryCharge,
    handlingCharge,
    smallCartCharge,
    grandTotal
  } = useCart();

  const router = useRouter();

  const handleCheckout = () => {
    router.push('/checkout');
    closeCart();
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/* Transparent Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={closeCart}
      />

      {/* Cart Sidebar */}
      {/* CRITICAL FIX: Ensure the max width is handled on smaller screens */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm sm:w-96 bg-white shadow-xl z-50 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">My Cart</h2>
            <span className="text-sm text-gray-600">{totalItems} items</span>
          </div>
          <button
            className="text-2xl text-gray-500 hover:text-gray-800 w-8 h-8 flex items-center justify-center"
            onClick={closeCart}
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-gray-500 text-lg">Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start border-b pb-4">
                    <div className="w-20 h-20 flex-shrink-0 mr-4">
                      {item.imageUrl && (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover rounded"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0"> {/* Added min-w-0 to prevent horizontal overflow */}
                      <h3 className="font-medium text-gray-800">{item.name}</h3>
                      {item.brand && (
                        <p className="text-xs text-gray-500">{item.brand}</p>
                      )}
                      <p className="text-gray-600 mt-1">₹{item.price}</p>
                      {item.weight && (
                        <p className="text-xs text-gray-500">{item.weight}</p>
                      )}
                      <div className="flex items-center mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l hover:bg-gray-100"
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <span className="w-8 h-8 flex items-center justify-center border-t border-b border-gray-300">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-800 text-sm ml-2 flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-bold text-lg text-gray-800 mb-4">Bill Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items total</span>
                    <span className="text-gray-800">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery charge</span>
                    <span className={`${deliveryCharge === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                      {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Handling charge</span>
                    <span className="text-gray-800">₹{handlingCharge}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Small cart charge</span>
                    <span className={`${smallCartCharge === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                      {smallCartCharge === 0 ? 'FREE' : `₹${smallCartCharge}`}
                    </span>
                  </div>
                  {subtotal < 100 && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800">
                        Add ₹{100 - subtotal} more to save on delivery & small cart charges!
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-4 border-t border-gray-200 mt-2">
                    <span className="text-gray-800">Grand total</span>
                    <span className="text-gray-800">₹{grandTotal}</span>
                  </div>
                </div>
              </div>

              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg mt-6 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
              >
                PROCEED TO CHECKOUT
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Cart;