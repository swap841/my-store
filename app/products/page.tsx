"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string; // Changed from 'image' to 'imageUrl'
  description: string;
  weight: number;
  updatedAt: any;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const router = useRouter();

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const productList: Product[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "",
            price: data.price || 0,
            imageUrl: data.imageUrl || null, // Changed from "" to null
            description: data.description || "",
            weight: data.weight || 0,
            updatedAt: data.updatedAt || null
          };
        });
        setProducts(productList);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    }
    fetchProducts();
  }, []);

  // Fetch cart items
  useEffect(() => {
    async function fetchCart() {
      try {
        const snapshot = await getDocs(collection(db, "cart"));
        const cartIds = snapshot.docs.map((doc) => doc.id);
        setCartItems(cartIds);
      } catch (error) {
        console.error("Failed to fetch cart:", error);
      }
    }
    fetchCart();
  }, []);

  const handleAddToCart = async (product: Product) => {
    try {
      await addDoc(collection(db, "cart"), {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        description: product.description,
        weight: product.weight,
        quantity: 1,
      });

      setCartItems((prev) => [...prev, product.id]);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  // Fix: Use null instead of empty string for missing imageUrl
  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) {
      return null; // Return null instead of empty string
    }
    return imageUrl;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-green-600">All Products</h1>

      {/* Global Go to Cart button */}
      {cartItems.length > 0 && (
        <div className="mb-4 text-right">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => router.push("/cart")}
          >
            Go to Cart ({cartItems.length})
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {products.length === 0 && (
          <p className="text-center col-span-3">No Products Found</p>
        )}

        {products.map((product) => {
          const imageSrc = getImageUrl(product.imageUrl);
          
          return (
            <div
              key={product.id}
              className="bg-white p-4 rounded-xl shadow"
            >
              {/* Conditionally render image or placeholder */}
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={product.name}
                  className="w-full h-40 object-cover rounded-lg"
                  onError={(e) => {
                    // If image fails to load, replace with placeholder
                    e.currentTarget.src = "https://via.placeholder.com/300x200";
                    e.currentTarget.onerror = null;
                  }}
                />
              ) : (
                <div className="w-full h-40 bg-gray-200 flex items-center justify-center rounded-lg">
                  <span className="text-gray-500">No Image</span>
                </div>
              )}
              
              <h2 className="text-xl font-semibold mt-3">{product.name}</h2>
              <p className="text-lg text-gray-600">₹ {product.price}</p>
              <p className="text-sm text-gray-500 mt-1">Weight: {product.weight}g</p>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                {product.description}
              </p>

              {/* Add / Go To Cart Button */}
              {cartItems.includes(product.id) ? (
                <button
                  className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  onClick={() => router.push("/cart")}
                >
                  Go to Cart
                </button>
              ) : (
                <button
                  className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                  onClick={() => handleAddToCart(product)}
                >
                  Add to Cart
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}