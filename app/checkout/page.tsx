"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { app } from "@/firebaseConfig";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  Timestamp, 
  getDoc 
} from "firebase/firestore";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

const db = getFirestore(app);
const auth = getAuth(app);

// --- Type Definitions ---
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  weight?: number; // Add weight field
  imageUrl?: string; // Changed from image to imageUrl
}

interface CustomerData {
  name: string;
  phone: string;
  address: string;
  geolocation?: string;
}

interface AreaCode {
  code: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [areaCode, setAreaCode] = useState<string | null>(null);
  const [orderWeight, setOrderWeight] = useState<number>(0);

  // Predefined area codes (for demonstration)
  // In production, these should be stored in Firestore and fetched
  const areaCodes: AreaCode[] = [
    { code: "AREA001", centerLat: 28.6139, centerLng: 77.2090, radiusKm: 2.5 }, // Delhi center
    { code: "AREA002", centerLat: 28.6532, centerLng: 77.2285, radiusKm: 2.5 }, // North Delhi
    { code: "AREA003", centerLat: 28.5750, centerLng: 77.1856, radiusKm: 2.5 }, // South Delhi
    { code: "AREA004", centerLat: 28.6667, centerLng: 77.2167, radiusKm: 2.5 }, // West Delhi
    { code: "AREA005", centerLat: 28.6167, centerLng: 77.3000, radiusKm: 2.5 }, // East Delhi
  ];

  // Function to calculate distance between two coordinates in km
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Function to assign area code based on location
  const assignAreaCode = (lat: number, lng: number): string => {
    // Check if location is within any predefined area
    for (const area of areaCodes) {
      const distance = calculateDistance(lat, lng, area.centerLat, area.centerLng);
      if (distance <= area.radiusKm) {
        return area.code;
      }
    }
    
    // If not within predefined area, generate a new area code based on grid
    // This creates a consistent code for areas within 2.5km radius
    const gridSize = 0.0225; // Approximately 2.5km in degrees at equator
    const gridX = Math.floor(lat / gridSize);
    const gridY = Math.floor(lng / gridSize);
    return `AREA_${gridX}_${gridY}`;
  };

  // Calculate order weight
  const calculateOrderWeight = (items: CartItem[]): number => {
    return items.reduce((total, item) => {
      const itemWeight = item.weight || 0; // Default to 0 if weight is undefined
      return total + (itemWeight * item.quantity);
    }, 0);
  };

  // Fetch user details
  const fetchUserDetails = async (uid: string, authDisplayName: string | null) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as CustomerData;
        setName(data.name || authDisplayName || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
      } else {
        setName(authDisplayName || "");
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
      setName(authDisplayName || "");
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchUserDetails(user.uid, user.displayName);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch cart from Firestore
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const snapshot = await getDocs(collection(db, "cart"));
        const items = snapshot.docs.map((docItem) => {
          const data = docItem.data();
          return {
            id: docItem.id,
            name: data.name || "",
            price: data.price || 0,
            quantity: data.quantity || 1,
            weight: data.weight || 0, // Added weight
            imageUrl: data.imageUrl || "", // Changed from image to imageUrl
          };
        });
        setCart(items);
        
        // Calculate order weight when cart changes
        const weight = calculateOrderWeight(items);
        setOrderWeight(weight);
      } catch (error) {
        console.error("Error fetching cart:", error);
      }
    };
    fetchCart();
  }, []);

  // Update area code when location changes
  useEffect(() => {
    if (location) {
      const code = assignAreaCode(location.lat, location.lng);
      setAreaCode(code);
    }
  }, [location]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLocation = { 
            lat: pos.coords.latitude, 
            lng: pos.coords.longitude 
          };
          setLocation(newLocation);
          
          // Assign area code immediately
          const code = assignAreaCode(newLocation.lat, newLocation.lng);
          setAreaCode(code);
        },
        (err) => alert("Location error: " + err.message)
      );
    } else {
      alert("Geolocation not supported.");
    }
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!currentUser) return alert("You must be logged in to place an order.");
    if (!name || !phone) return alert("Enter name & phone.");
    if (!location) return alert("Please get location first.");
    if (cart.length === 0) return alert("Cart is empty!");
    if (!areaCode) return alert("Could not determine area code. Please try getting location again.");

    setLoading(true);

    try {
      // Define the path to the user's orders subcollection
      const ordersSubcollectionRef = collection(
        db, 
        "users", 
        currentUser.uid, 
        "orders" 
      );
      
      // Calculate total weight
      const totalWeight = calculateOrderWeight(cart);
      
      // Save the order to the subcollection
      await addDoc(ordersSubcollectionRef, {
        userId: currentUser.uid,
        name,
        phone,
        deliveryAddress: address,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          weight: item.weight || 0,
          imageUrl: item.imageUrl || "",
        })),
        totalAmount: total,
        totalWeight: totalWeight, // Save total weight
        status: "pending",
        date: Timestamp.now(),
        location: {
          lat: location.lat,
          lng: location.lng
        },
        areaCode: areaCode, // Save area code
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      // Clear cart in Firestore
      const cartSnapshot = await getDocs(collection(db, "cart"));
      const deletePromises = cartSnapshot.docs.map((docItem) =>
        deleteDoc(doc(db, "cart", docItem.id))
      );
      await Promise.all(deletePromises);

      // Clear local state
      setCart([]);
      setName("");
      setPhone("");
      setAddress("");
      setLocation(null);
      setAreaCode(null);
      setOrderWeight(0);

      alert("Order placed successfully!");
      router.push("/products");
    } catch (err) {
      console.error("Error placing order:", err);
      alert("Error placing order.");
    }

    setLoading(false);
  };

  // --- Render ---
  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Checkout</h1>

      {!currentUser && (
        <div className="p-4 mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg">
          <p className="font-medium">Please log in to place an order.</p>
          <p className="text-sm mt-1">Your details will be auto-filled if you have an account.</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-medium text-gray-700">Name *</label>
            <input 
              className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Full Name"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700">Phone *</label>
            <input 
              className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="Phone Number"
              required
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block mb-2 font-medium text-gray-700">Address (optional)</label>
          <textarea 
            className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
            placeholder="Delivery Address"
            rows={3}
          />
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <label className="font-medium text-gray-700">Location *</label>
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              onClick={getLocation}
              type="button"
            >
              Get Current Location
            </button>
          </div>
          
          {location && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">
                <span className="font-medium">Location Set:</span> Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}
              </p>
              {areaCode && (
                <p className="text-green-700 mt-1">
                  <span className="font-medium">Area Code:</span> {areaCode}
                </p>
              )}
            </div>
          )}
          
          {!location && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
              Location not set. Please click "Get Current Location" to set your delivery location.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        
        {cart.length === 0 ? (
          <p className="text-gray-600">No products in cart.</p>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-3 border-b">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    Quantity: {item.quantity} × ₹{item.price}
                    {item.weight && ` • Weight: ${item.weight}g each`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{item.price * item.quantity}</p>
                  {item.weight && (
                    <p className="text-sm text-gray-500">{item.weight * item.quantity}g</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>₹{total}</span>
          </div>
          
          {orderWeight > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Total Weight</span>
              <span>{orderWeight}g ({orderWeight/1000} kg)</span>
            </div>
          )}
          
          {areaCode && (
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Area</span>
              <span className="font-medium">{areaCode}</span>
            </div>
          )}
          
          <div className="flex justify-between text-lg font-bold pt-4 border-t">
            <span>Total Amount</span>
            <span>₹{total}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Payment</h2>
        <p className="text-gray-600 mb-6">Currently we only accept Cash on Delivery (COD)</p>
        
        <button
          className={`w-full py-3 px-4 rounded-lg font-semibold text-lg transition ${
            loading || !currentUser || !location || !name || !phone 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
          onClick={handlePlaceOrder}
          disabled={loading || !currentUser || !location || !name || !phone}
        >
          {loading ? "Placing Order..." : "Place Order (Cash on Delivery)"}
        </button>
        
        {(loading || !currentUser || !location || !name || !phone) && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-sm">
              {!currentUser && "• You must be logged in to place an order\n"}
              {!name && "• Name is required\n"}
              {!phone && "• Phone number is required\n"}
              {!location && "• Location is required\n"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}