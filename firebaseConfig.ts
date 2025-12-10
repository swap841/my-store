import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "....",
  projectId: "...",
};

export const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
