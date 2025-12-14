"use client";

import { useCart } from "@/components/CartContext";
import { Plus, Minus } from "lucide-react";
import Image from "next/image";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    discountPercentage?: number; // Added this property
    discountText?: string; // Added this property
    imageUrl?: string;
    weight?: string;
    brand?: string;
    isInStock?: boolean;
    category?: string; // Added this property
    categoryId?: string; // Added this property
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, removeFromCart, updateQuantity, cartItems } = useCart();

  const cartItem = cartItems.find((item) => item.id === product.id);
  const quantity = cartItem?.quantity || 0;

  // ---------- DISCOUNT CALCULATION ----------
  const isDiscounted =
    product.originalPrice && product.originalPrice > product.price;

  const discountPercent = isDiscounted
    ? Math.round(
        ((product.originalPrice! - product.price) / product.originalPrice!) *
          100
      )
    : 0;

  const discountAmount = isDiscounted
    ? product.originalPrice! - product.price
    : 0;
  // ----------------------------------------

  const handleAddToCart = () => addToCart(product);

  const handleIncrement = () =>
    updateQuantity(product.id, quantity + 1);

  const handleDecrement = () => {
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1);
    } else {
      removeFromCart(product.id);
    }
  };

  return (
    <div className="w-60 bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm">

      {/* IMAGE SECTION */}
      <div className="relative h-48 bg-gray-50">

        {/* DISCOUNT RIBBON */}
        {isDiscounted && (
          <div className="absolute top-0 left-0 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-br-lg shadow-md z-10">
            {discountPercent}% OFF
          </div>
        )}

        {/* PRODUCT IMAGE */}
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="15rem"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}

        {/* ADD / QUANTITY BUTTON */}
        {product.isInStock === false ? (
          <div className="absolute bottom-2 right-2 bg-gray-300 text-gray-500 font-bold px-3 py-1.5 rounded text-xs uppercase">
            Sold Out
          </div>
        ) : quantity === 0 ? (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-2 right-2 bg-white text-pink-600 font-bold px-4 py-2 
                       rounded-md shadow-md border-2 border-pink-500 hover:bg-pink-50 
                       transition-colors uppercase text-sm"
          >
            ADD
          </button>
        ) : (
          <div className="absolute bottom-2 right-2 flex items-center justify-between 
                          bg-pink-500 text-white rounded w-24 text-sm font-bold 
                          shadow-lg border-2 border-pink-500">
            <button
              onClick={handleDecrement}
              className="w-1/3 p-1 hover:bg-pink-600"
            >
              <Minus size={14} />
            </button>
            <span className="w-1/3 text-center">{quantity}</span>
            <button
              onClick={handleIncrement}
              className="w-1/3 p-1 hover:bg-pink-600"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      {/* DETAILS SECTION */}
      <div className="p-3 pt-0">

        {/* PRICE ROW */}
        <div className="flex items-center mt-2 mb-1">
          <span className="inline-flex items-center px-4 py-2 mr-2 rounded-xl 
                           bg-white shadow-md border border-green-200">
            <span className="text-sm text-green-700 mr-1">₹</span>
            <span className="text-xl font-extrabold text-green-700">
              {product.price}
            </span>
          </span>

          {isDiscounted && (
            <span className="text-sm text-gray-400 line-through">
              ₹{product.originalPrice}
            </span>
          )}
        </div>

        {/* DISCOUNT AMOUNT */}
        {isDiscounted && (
          <div className="text-xs font-medium text-green-700 bg-green-50 
                          w-fit px-2 py-0.5 rounded mb-1">
            You save ₹{discountAmount}
          </div>
        )}

        {/* PRODUCT NAME */}
        <h3 className="text-base font-bold text-gray-800 leading-snug mb-1">
          {product.name}
        </h3>

        {/* WEIGHT */}
        {product.weight && (
          <p className="text-sm text-gray-500">
            {product.weight} gram
          </p>
        )}
      </div>
    </div>
  );
}