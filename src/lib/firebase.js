// Firebase initialization for Next.js App Router

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqp4ioSFI1D97hdixZmRo_h7Z6wiu2SeA",
  authDomain: "my-store-51b02.firebaseapp.com",
  projectId: "my-store-51b02",
  storageBucket: "my-store-51b02.appspot.com", 
  messagingSenderId: "240390353694",
  appId: "1:240390353694:web:70110e5cc4e44c3991cf0f",
  measurementId: "G-39Q7GDP8YT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore DB
export const db = getFirestore(app);




