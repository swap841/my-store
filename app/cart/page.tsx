'use client';

import React from 'react';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './Cart.module.css';

const Cart: React.FC = () => {
  const {
    isCartOpen,
    cartItems,
    toggleCart,
    removeFromCart,
    updateQuantity,
    getTotalItems,
    getTotalPrice
  } = useCart();
  
  const router = useRouter();
  
  const deliveryCharge = 50;
  const handlingCharge = 20;
  const smallCartCharge = cartItems.length === 0 ? 0 : 10;
  
  const handleCheckout = () => {
    router.push('/checkout');
    toggleCart(); // Close cart when navigating to checkout
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/* Transparent Overlay */}
      <div 
        className={styles.overlay}
        onClick={toggleCart}
      />
      
      {/* Cart Sidebar */}
      <div className={styles.cartContainer}>
        <div className={styles.cartHeader}>
          <h2>My Cart</h2>
          <span className={styles.itemCount}>{getTotalItems()} items</span>
          <button className={styles.closeButton} onClick={toggleCart}>
            ×
          </button>
        </div>
        
        <div className={styles.cartContent}>
          {cartItems.length === 0 ? (
            <div className={styles.emptyCart}>
              <p>Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className={styles.cartItems}>
                {cartItems.map((item) => (
                  <div key={item.id} className={styles.cartItem}>
                    <div className={styles.itemImage}>
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        className={styles.productImage}
                      />
                    </div>
                    <div className={styles.itemDetails}>
                      <h3 className={styles.itemName}>{item.name}</h3>
                      <p className={styles.itemPrice}>¥{item.price}</p>
                      <div className={styles.quantityControls}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className={styles.quantityButton}
                        >
                          −
                        </button>
                        <span className={styles.quantity}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className={styles.quantityButton}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              
              <div className={styles.billDetails}>
                <h3>Bill Details</h3>
                <div className={styles.billRow}>
                  <span>Items total</span>
                  <span>¥{getTotalPrice()}</span>
                </div>
                <div className={styles.billRow}>
                  <span>Delivery charge</span>
                  <span>¥{deliveryCharge}</span>
                </div>
                <div className={styles.billRow}>
                  <span>Handling charge</span>
                  <span>¥{handlingCharge}</span>
                </div>
                <div className={styles.billRow}>
                  <span>Small cart charge</span>
                  <span>¥{smallCartCharge}</span>
                </div>
                <div className={styles.billTotal}>
                  <span>Grand total</span>
                  <span>¥{getTotalPrice() + deliveryCharge + handlingCharge + smallCartCharge}</span>
                </div>
              </div>
              
              <button 
                className={styles.checkoutButton}
                onClick={handleCheckout}
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