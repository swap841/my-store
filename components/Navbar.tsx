"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from "firebase/auth";
import { app } from "@/firebaseConfig";
// Import cart context
import { useCart } from "@/components/CartContext";
import { ShoppingCart } from 'lucide-react';

const auth = getAuth(app);

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter(); 
  
  // Get cart data
  const { totalItems, subtotal, openCart } = useCart();

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.log("Login Error:", err);
    }
  };

  const logoutUser = async () => {
    await signOut(auth);
    router.push("/products"); 
  };

  return (
    <nav className="w-full bg-white shadow-md fixed top-0 left-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/products" className="text-2xl font-bold text-green-600">
          My Grocery Store
        </Link>

        <div className="flex items-center gap-4">
          {/* Cart Button */}
          <button
            onClick={openCart}
            className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors"
          >
            <ShoppingCart size={20} />
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium">
                {totalItems === 0 ? "0 Items" : `${totalItems} Item${totalItems > 1 ? 's' : ''}`}
              </span>
              <span className="font-bold">₹{subtotal}</span>
            </div>
          </button>

          {user ? (
            <>
              {/* Clicking profile image navigates to /profile */}
              <Link href="/profile">
                <Image
                  src={user.photoURL || "/fallback-image.png"}
                  width={40}
                  height={40}
                  alt="Profile"
                  className="rounded-full cursor-pointer"
                />
              </Link>
              <button
                onClick={logoutUser}
                className="px-4 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="px-4 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Sign In with Google
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}