"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { getAuth } from "firebase/auth";
import { getAreaCode } from "../utils/getAreaCode";
import { doc, setDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CheckoutPageContent() {
  const router = useRouter();
  const auth = getAuth();

  const {
    cartItems,
    subtotal,
    deliveryCharge,
    handlingCharge,
    smallCartCharge,
    grandTotal,
    clearCart,
  } = useCart();

  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [areaCode, setAreaCode] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState<"delivery" | "pickup">("delivery");

  const totalSavings = deliveryCharge === 0 ? 25 : 0;

  // Ensure user is logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) {
        router.push("/login");
      } else {
        setUser(u);
        setName(u.displayName || "");
        setPhone(u.phoneNumber || "");
      }
    });
    return () => unsubscribe();
  }, [auth, router]);

  // Get delivery location (optional - only for delivery)
  useEffect(() => {
    if (deliveryOption === "delivery") {
      if (!navigator.geolocation) {
        console.warn("Geolocation is not supported by your browser");
        return;
      }

      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setLocation(coords);
          const code = getAreaCode(coords.lat, coords.lng);
          setAreaCode(code);
          setIsLoading(false);
        },
        (error) => {
          console.warn("Location permission denied or error:", error);
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  }, [deliveryOption]);

  // Save user profile data to Firestore
  const saveUserProfile = async () => {
    if (!user) return;
    
    try {
      const userRef = doc(db, "users", user.uid);
      const geolocationStr = location 
        ? `${location.lat.toFixed(6)},${location.lng.toFixed(6)}`
        : "";
      
      await setDoc(userRef, {
        name: name,
        phone: phone,
        address: address,
        geolocation: geolocationStr,
        email: user.email,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      
      console.log("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Save order to Firestore
  const saveOrderToFirestore = async (orderData: any) => {
    if (!user) return null;
    
    try {
      const ordersRef = doc(collection(db, "users", user.uid, "orders"));
      await setDoc(ordersRef, {
        ...orderData,
        id: ordersRef.id,
        date: new Date().toISOString(),
        timestamp: Date.now(),
      });
      
      return ordersRef.id;
    } catch (error) {
      console.error("Error saving order:", error);
      return null;
    }
  };

  const placeOrder = async () => {
    if (!name) {
      alert("Please enter your name");
      return;
    }
    if (!phone) {
      alert("Please enter your phone number");
      return;
    }

    if (deliveryOption === "delivery") {
      if (!address) {
        alert("Please enter delivery address");
        return;
      }
      if (!areaCode) {
        console.warn("Area code not available, but proceeding anyway");
      }
    } else {
      setLocation({ lat: 0, lng: 0 });
      setAreaCode("PICKUP");
    }

    if (!user) {
      alert("User not logged in");
      return;
    }

    if (paymentMethod === "UPI") {
      alert("UPI payment is currently not working. Please use Cash on Delivery.");
      return;
    }

    setIsLoading(true);

    try {
      await saveUserProfile();

      const orderData = {
        userId: user.uid,
        userName: name,
        userPhone: phone,
        userEmail: user.email,
        deliveryAddress: deliveryOption === "delivery" ? address : "Store Pickup",
        deliveryLocation: deliveryOption === "delivery" ? location : null,
        areaCode: deliveryOption === "delivery" ? areaCode : "PICKUP",
        deliveryOption,
        items: cartItems.map(item => ({
          productId: item.id || item.name,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.imageUrl || "", // FIXED: Changed from image to imageUrl
        })),
        paymentMethod,
        subtotal,
        deliveryCharge: deliveryOption === "delivery" ? deliveryCharge : 0,
        handlingCharge,
        smallCartCharge,
        totalAmount: deliveryOption === "delivery" ? grandTotal : (subtotal + handlingCharge + smallCartCharge),
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const orderId = await saveOrderToFirestore(orderData);
      
      if (orderId) {
        console.log("ORDER PLACED", orderData);
        
        if (clearCart) {
          clearCart();
        }
        
        alert(`Order #${orderId} placed successfully! ${deliveryOption === "delivery" ? 'Delivery' : 'Pickup'} confirmed.`);
        
        router.push("/");
      } else {
        alert("Failed to save order. Please try again.");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("An error occurred while placing your order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getDeliveryLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLocation(coords);
        const code = getAreaCode(coords.lat, coords.lng);
        setAreaCode(code);
        setIsLoading(false);
        alert("Delivery location updated successfully!");
      },
      (error) => {
        setIsLoading(false);
        alert("Failed to get location. Please enable location permissions.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
        <h2 className="font-bold text-lg mb-4 text-gray-800">Order Type</h2>
        <div className="grid grid-cols-2 gap-4">
          <div 
            className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${deliveryOption === "delivery" ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}
            onClick={() => setDeliveryOption("delivery")}
          >
            <div className="flex items-center">
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center mr-3 ${deliveryOption === "delivery" ? 'border-green-500 bg-green-500' : 'border-gray-400'}`}>
                {deliveryOption === "delivery" && <div className="h-2 w-2 rounded-full bg-white"></div>}
              </div>
              <div>
                <h3 className="font-semibold">Home Delivery</h3>
                <p className="text-sm text-gray-600">Get it delivered to your address</p>
                <p className="text-sm font-medium mt-1">Delivery: ₹{deliveryCharge}</p>
              </div>
            </div>
          </div>
          
          <div 
            className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${deliveryOption === "pickup" ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
            onClick={() => setDeliveryOption("pickup")}
          >
            <div className="flex items-center">
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center mr-3 ${deliveryOption === "pickup" ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`}>
                {deliveryOption === "pickup" && <div className="h-2 w-2 rounded-full bg-white"></div>}
              </div>
              <div>
                <h3 className="font-semibold">Store Pickup</h3>
                <p className="text-sm text-gray-600">Pick up from our store</p>
                <p className="text-sm font-medium mt-1">Free pickup</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
        <h2 className="font-bold text-lg mb-4 text-gray-800">Customer Information</h2>
        
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-300 p-3 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              className="w-full bg-transparent outline-none text-gray-800"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="rounded-xl border border-gray-300 p-3 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              className="w-full bg-transparent outline-none text-gray-800"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              required
            />
          </div>

          {deliveryOption === "delivery" && (
            <>
              <div className="rounded-xl border border-gray-300 p-3 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address *
                </label>
                <textarea
                  className="w-full bg-transparent outline-none text-gray-800 resize-none"
                  placeholder="Enter complete delivery address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  This address will be saved to your profile
                </p>
              </div>

              <div className="rounded-xl border border-gray-300 p-3 bg-gray-50">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Delivery Location (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={getDeliveryLocation}
                    disabled={isLoading}
                    className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-lg"
                  >
                    {isLoading ? "Getting..." : "📍 Get Location"}
                  </button>
                </div>
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span className="text-gray-600">Detecting location...</span>
                  </div>
                ) : location ? (
                  <div className="text-gray-800">
                    <p className="text-sm">📍 Delivery location detected</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-500 text-sm">Location not detected yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Click "Get Location" to add your delivery coordinates
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-300 p-3 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Area Code
                </label>
                {areaCode ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-800">{areaCode}</span>
                    <span className="text-green-600 text-sm">✓ Service available</span>
                  </div>
                ) : (
                  <p className="text-gray-600">
                    {isLoading ? "Detecting area code..." : "Get location to see area code"}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  This determines delivery availability and charges
                </p>
              </div>
            </>
          )}

          {deliveryOption === "pickup" && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <span className="text-blue-600 font-bold">📍</span>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800">Store Pickup Information</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    Our Store Address: 123 Grocery Street, City Center, Mumbai - 400001
                  </p>
                  <p className="text-blue-600 text-sm mt-2">
                    ⏰ Pickup Hours: 9:00 AM - 9:00 PM
                  </p>
                  <p className="text-blue-600 text-sm mt-1">
                    📞 Store Phone: +91 98765 43210
                  </p>
                </div>
              </div>
            </div>
          )}

          {user?.email && (
            <div className="rounded-xl border border-gray-300 p-3 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <p className="text-gray-800">{user.email}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
        <h2 className="font-bold text-lg mb-4 text-gray-800">
          {deliveryOption === "delivery" ? "Bill Summary" : "Pickup Order Summary"}
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Items total</span>
            <span className="font-medium">₹{subtotal}</span>
          </div>
          {deliveryOption === "delivery" && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Delivery</span>
              <span className="font-medium">₹{deliveryCharge}</span>
            </div>
          )}
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Handling</span>
            <span className="font-medium">₹{handlingCharge}</span>
          </div>
          {smallCartCharge > 0 && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Small cart</span>
              <span className="font-medium">₹{smallCartCharge}</span>
            </div>
          )}
          <div className="border-t pt-3 mt-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Grand Total</span>
              <span className="text-green-600">
                ₹{deliveryOption === "delivery" ? grandTotal : (subtotal + handlingCharge + smallCartCharge)}
              </span>
            </div>
          </div>
          {deliveryOption === "delivery" && totalSavings > 0 && (
            <div className="bg-green-50 rounded-xl p-3 mt-3">
              <p className="text-green-700 text-sm">
                🎉 You saved ₹{totalSavings} on delivery!
              </p>
            </div>
          )}
          {deliveryOption === "pickup" && (
            <div className="bg-blue-50 rounded-xl p-3 mt-3">
              <p className="text-blue-700 text-sm">
                ✅ No delivery charges for pickup orders!
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
        <h2 className="font-bold text-lg mb-4 text-gray-800">Payment Method</h2>
        <div className="space-y-3">
          <div className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${paymentMethod === "COD" ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
            <label className="flex items-center cursor-pointer">
              <input 
                type="radio" 
                className="h-5 w-5 text-green-600"
                checked={paymentMethod === "COD"} 
                onChange={() => setPaymentMethod("COD")} 
              />
              <span className="ml-3 text-gray-800 font-medium">Cash on Delivery</span>
            </label>
            <p className="text-xs text-gray-500 ml-8 mt-1">Pay when you receive your order</p>
          </div>
          <div className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${paymentMethod === "UPI" ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
            <label className="flex items-center cursor-pointer">
              <input 
                type="radio" 
                className="h-5 w-5 text-green-600"
                checked={paymentMethod === "UPI"} 
                onChange={() => setPaymentMethod("UPI")} 
              />
              <span className="ml-3 text-gray-800 font-medium">UPI Payment</span>
            </label>
            <p className="text-xs text-amber-500 ml-8 mt-1">⚠️ Currently not working - Please use COD</p>
          </div>
        </div>
      </div>

      <button
        onClick={placeOrder}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Placing Order...
          </div>
        ) : (
          `Place ${deliveryOption === "delivery" ? "Delivery" : "Pickup"} Order - ₹${deliveryOption === "delivery" ? grandTotal : (subtotal + handlingCharge + smallCartCharge)}`
        )}
      </button>
    </div>
  );
}