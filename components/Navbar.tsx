"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
// --- 1. Import useRouter from Next.js ---
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

const auth = getAuth(app);

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  // --- 2. Initialize the router object ---
  const router = useRouter(); 

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
    // --- 3. Correct the push path to "/products" ---
    router.push("/products"); 
  };


  return (
    <nav className="w-full bg-white shadow-md fixed top-0 left-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/products" className="text-2xl font-bold text-green-600">
          My Grocery Store
        </Link>

        <div className="flex items-center gap-4">
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
                className="px-4 py-1 bg-red-500 text-white rounded-lg"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="px-4 py-1 bg-green-600 text-white rounded-lg"
            >
              Sign In with Google
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}