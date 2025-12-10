import "./globals.css";
import { CartProvider } from "./context/CartContext";
import Navbar from "../components/Navbar";
import { Geist, Geist_Mono } from "next/font/google";
import { ReactNode } from "react";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <CartProvider>
          <Navbar />
          <div className="pt-20">
            {children}
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
