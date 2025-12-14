import "./globals.css";
import { CartProvider } from "../components/CartContext";
import Navbar from "../components/Navbar";
import CartDrawer from "../components/CartDrawer";
import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";

const geistSans = Geist({ 
  variable: "--font-geist-sans", 
  subsets: ["latin"] 
});

const geistMono = Geist_Mono({ 
  variable: "--font-geist-mono", 
  subsets: ["latin"] 
});

export const metadata: Metadata = {
  title: "QuickCart - 15 Minute Grocery Delivery",
  description: "Fresh groceries delivered to your doorstep in 15 minutes",
  keywords: ["grocery", "delivery", "quick", "15 minutes", "online shopping"],
  openGraph: {
    title: "QuickCart - 15 Minute Grocery Delivery",
    description: "Fresh groceries delivered to your doorstep in 15 minutes",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-sans antialiased bg-gray-50">
        <CartProvider>
          <Navbar />
          <main className="pt-16 md:pt-20">
            {children}
          </main>
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}