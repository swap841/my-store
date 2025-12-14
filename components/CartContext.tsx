"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

/* ===================== TYPES ===================== */

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  weight?: string;
  brand?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  weight?: string;
  category?: string;
  categoryId?: string;
  brand?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  totalItems: number;
  subtotal: number;
  deliveryCharge: number;
  handlingCharge: number;
  smallCartCharge: number;
  grandTotal: number;

  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

/* ===================== CONTEXT ===================== */

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

/* ===================== PROVIDER ===================== */

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  /* ---------- CLIENT MOUNT ---------- */
  useEffect(() => {
    setIsMounted(true);

    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (err) {
        console.error("Failed to parse cart", err);
      }
    }
  }, []);

  /* ---------- SAVE CART ---------- */
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isMounted]);

  /* ---------- CART ACTIONS ---------- */

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);

      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          imageUrl: product.imageUrl,
          weight: product.weight,
          brand: product.brand,
        },
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCartItems([]);

  /* ---------- CALCULATIONS ---------- */

  const totalItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  /* ---------- BLINKIT STYLE LOGIC ---------- */

  const FREE_DELIVERY_THRESHOLD = 100;

  const deliveryCharge =
    subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 25;

  const handlingCharge = 2;

  const smallCartCharge =
    subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 20;

  const grandTotal =
    subtotal +
    deliveryCharge +
    handlingCharge +
    smallCartCharge;

  /* ---------- DEBUG ---------- */
  useEffect(() => {
    if (isMounted) {
      console.log("Cart updated", {
        cartItems,
        subtotal,
        deliveryCharge,
        smallCartCharge,
        grandTotal,
      });
    }
  }, [cartItems, subtotal, grandTotal, isMounted]);

  /* ---------- PROVIDER ---------- */

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,

        totalItems,
        subtotal,
        deliveryCharge,
        handlingCharge,
        smallCartCharge,
        grandTotal,

        isCartOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
