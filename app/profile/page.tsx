"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getAuth, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";

// --- Type Definitions ---
type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

type Order = {
  id: string;
  createdAt: Timestamp | { seconds: number };
  date: Timestamp | { seconds: number };
  items: OrderItem[];
  totalAmount: number;
  status: string;
  deliveryAddress: string;
  location?: {
    lat: number;
    lng: number;
    name: string;
    phone: string;
  };
  phone?: string;
};

type CustomerData = {
  name: string;
  phone: string;
  address: string;
  geolocation: string;
};

// Define which statuses are considered "current" vs "past"
// Using lowercase for comparison
const CURRENT_STATUSES = ["pending", "dispatched", "processing", "confirmed", "shipped"];
const PAST_STATUSES = ["delivered", "completed", "fulfilled", "cancelled"];

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: "",
    phone: "",
    address: "",
    geolocation: "",
  });
  const [currentOrders, setCurrentOrders] = useState<Order[]>([]);
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const router = useRouter();

  // --- Fetch Customer Data Function ---
  const fetchCustomerData = async (uid: string, displayName: string | null) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCustomerData(docSnap.data() as CustomerData);
      } else {
        setCustomerData((prev) => ({
          ...prev,
          name: displayName || "",
        }));
      }
    } catch (err) {
      console.error("Error fetching customer data:", err);
    }
  };

  // --- Effect 1: Auth State Listener ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchCustomerData(currentUser.uid, currentUser.displayName);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  // --- Effect 2: Order State Listener ---
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // Listen to the orders subcollection for the current user
    const ordersRef = collection(db, "users", user.uid, "orders");
    const q = query(ordersRef, orderBy("date", "desc"));

    const unsubscribeOrders = onSnapshot(q, (snapshot) => {
      const orders: Order[] = [];

      snapshot.forEach((doc) => {
        try {
          const data = doc.data();

          console.log("Order data:", data);

          // Handle date field - use createdAt or date, whichever exists
          let dateValue: Timestamp | { seconds: number };
          const dateField = data.date || data.createdAt;

          if (dateField && typeof dateField.toDate === 'function') {
            // It's a Firestore Timestamp
            dateValue = dateField;
          } else if (dateField && dateField.seconds) {
            // It's a timestamp object with seconds
            dateValue = { seconds: dateField.seconds };
          } else if (dateField instanceof Date) {
            // It's a JS Date object
            dateValue = { seconds: Math.floor(dateField.getTime() / 1000) };
          } else if (dateField) {
            // Try to parse whatever we have
            const timestamp = new Date(dateField).getTime();
            dateValue = { seconds: Math.floor(timestamp / 1000) };
          } else {
            // Fallback to current time
            dateValue = { seconds: Math.floor(Date.now() / 1000) };
          }

          // Create order object
          const order: Order = {
            id: doc.id,
            createdAt: dateValue,
            date: dateValue,
            items: data.items || [],
            totalAmount: data.totalAmount || 0,
            status: data.status || "pending",
            deliveryAddress: data.deliveryAddress || data.location?.name || "",
            location: data.location,
            phone: data.phone || data.location?.phone || "",
          };

          orders.push(order);
        } catch (error) {
          console.error(`Error processing order ${doc.id}:`, error);
        }
      });

      // Debug: Log all orders and their statuses
      console.log("All orders:", orders.map(o => ({
        id: o.id,
        status: o.status,
        statusLower: o.status.toLowerCase()
      })));

      // Filter orders based on status (case-insensitive comparison)
      const current = orders.filter((order) => {
        const statusLower = order.status.toLowerCase();
        return CURRENT_STATUSES.includes(statusLower);
      });

      const past = orders.filter((order) => {
        const statusLower = order.status.toLowerCase();
        return PAST_STATUSES.includes(statusLower);
      });

      // Debug: Log filtered results
      console.log("Current orders count:", current.length);
      console.log("Past orders count:", past.length);
      console.log("Current statuses:", CURRENT_STATUSES);
      console.log("Past statuses:", PAST_STATUSES);

      setCurrentOrders(current);
      setPastOrders(past);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    return () => unsubscribeOrders();
  }, [user]);

  // --- Handlers ---
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, customerData, { merge: true });
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile");
    }
  };

  const handleReorder = async (order: Order) => {
    if (!user) return;
    try {
      const ordersRef = collection(db, "users", user.uid, "orders");
      await addDoc(ordersRef, {
        items: order.items,
        totalAmount: order.totalAmount,
        status: "pending",
        date: Timestamp.now(),
        createdAt: Timestamp.now(),
        deliveryAddress: customerData.address || "",
        phone: customerData.phone || "",
      });
      alert("Order placed again!");
    } catch (err) {
      console.error("Error reordering:", err);
    }
  };

  // Get status display color
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (CURRENT_STATUSES.includes(statusLower)) {
      if (statusLower === "pending") return "bg-yellow-500";
      if (statusLower === "dispatched") return "bg-blue-500";
      if (statusLower === "processing") return "bg-orange-500";
      return "bg-blue-500";
    }
    if (PAST_STATUSES.includes(statusLower)) {
      if (statusLower === "cancelled") return "bg-red-500";
      return "bg-green-500";
    }
    return "bg-gray-500";
  };

  // Get status display text
  const getStatusText = (status: string) => {
    return status.toUpperCase();
  };

  // Get address from order
  const getOrderAddress = (order: Order) => {
    if (order.deliveryAddress) return order.deliveryAddress;
    if (order.location?.name) return order.location.name;
    return "Address not specified";
  };

  // Get phone from order
  const getOrderPhone = (order: Order) => {
    if (order.phone) return order.phone;
    if (order.location?.phone) return order.location.phone;
    return "Phone not specified";
  };

  // Get date from order
  const getOrderDate = (order: Order) => {
    try {
      const timestamp = order.date || order.createdAt;
      if (timestamp && typeof timestamp === 'object') {
        const seconds = (timestamp as any).seconds ||
                       (timestamp as any)._seconds ||
                       (timestamp as any)?.toDate?.()?.getTime() / 1000;
        if (seconds) {
          return new Date(seconds * 1000).toLocaleString();
        }
      }
      return "Date not available";
    } catch (error) {
      return "Date not available";
    }
  };

  // --- Render ---
  if (!user) {
    return (
      <div className="p-8 text-center">
        <p>Please login to view your profile.</p>
      </div>
    );
  }

  return (
    // CRITICAL FIX: Use p-4 on mobile, stack columns vertically (space-y-6), and use two columns only on large screens (lg:flex lg:gap-8)
    <div className="p-4 sm:p-8 mt-4 sm:mt-20 max-w-7xl mx-auto space-y-6 lg:space-y-0 lg:flex lg:gap-8">
      {/* Left: Profile Edit - Make it w-full on mobile, then w-1/3 on large screens */}
      <div className="w-full lg:w-1/3 bg-white shadow-md rounded-lg p-6 flex flex-col items-center">
        <Image
          src={user.photoURL || "/fallback-image.png"}
          width={120}
          height={120}
          alt="Profile"
          className="rounded-full mb-4"
        />

        {/* Full Name Input */}
        <h1 className="text-2xl font-bold mb-2">{customerData.name}</h1>
        <div className="w-full mb-2">
          <label className="block text-gray-600 mb-1">Full Name</label>
          <input
            type="text"
            value={customerData.name || ""}
            onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
            className="w-full p-2 border rounded-lg"
            placeholder="Your Full Name"
          />
        </div>

        {/* Email, Phone, Address Inputs */}
        <div className="w-full mb-2">
          <label className="block text-gray-600 mb-1">Email</label>
          <input
            type="email"
            value={user.email || ""}
            disabled
            className="w-full p-2 border rounded-lg bg-gray-100 cursor-not-allowed"
          />
        </div>
        <div className="w-full mb-2">
          <label className="block text-gray-600 mb-1">Phone</label>
          <input
            type="text"
            value={customerData.phone || ""}
            onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
            className="w-full p-2 border rounded-lg"
            placeholder="Phone number"
          />
        </div>
        <div className="w-full mb-4">
          <label className="block text-gray-600 mb-1">Address</label>
          <textarea
            value={customerData.address || ""}
            onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
            className="w-full p-2 border rounded-lg"
            placeholder="Delivery address"
            rows={3}
          />
        </div>
        <div className="flex gap-4 mt-2">
          <button
            onClick={handleSaveProfile}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Save
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Right: Orders - Make it w-full on mobile, then w-2/3 on large screens */}
      <div className="w-full lg:w-2/3">
        {/* ... Rest of the Orders section code ... */}
        {/* Current Orders */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Current Orders</h2>

        {loading ? (
          <p className="text-gray-500 p-4 bg-gray-50 rounded-lg">Loading orders...</p>
        ) : currentOrders.length === 0 ? (
          <p className="text-gray-500 p-4 bg-gray-50 rounded-lg">No current orders.</p>
        ) : (
          <div className="space-y-4">
            {currentOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white shadow-md rounded-lg p-4 border border-blue-100"
              >
                <div className="flex justify-between items-start mb-2 border-b pb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">
                      Order ID: {order.id}
                    </p>
                    <p className="text-xs text-gray-500">
                      Date: {getOrderDate(order)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${getStatusColor(
                      order.status
                    )} flex-shrink-0 ml-2`}
                  >
                    {getStatusText(order.status)}
                  </span>
                </div>

                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Total:</span> ₹{order.totalAmount}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  <span className="font-medium">Deliver to:</span> {getOrderAddress(order)}
                </p>
                <div className="mt-2 text-xs">
                  <span className="font-medium">Items:</span>{" "}
                  {order.items.map((item) => item.name).join(", ")}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Past Orders */}
        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">Past Orders</h2>

        {loading ? (
          <p className="text-gray-500 p-4 bg-gray-50 rounded-lg">Loading orders...</p>
        ) : pastOrders.length === 0 ? (
          <p className="text-gray-500 p-4 bg-gray-50 rounded-lg">No past orders.</p>
        ) : (
          <div className="space-y-4">
            {pastOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white shadow-md rounded-lg p-4 border border-gray-100"
              >
                <div className="flex justify-between items-start mb-2 border-b pb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">
                      Order ID: {order.id}
                    </p>
                    <p className="text-xs text-gray-500">
                      Date: {getOrderDate(order)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${getStatusColor(
                      order.status
                    )} flex-shrink-0 ml-2`}
                  >
                    {getStatusText(order.status)}
                  </span>
                </div>

                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Total:</span> ₹{order.totalAmount}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  <span className="font-medium">Deliver to:</span> {getOrderAddress(order)}
                </p>
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-xs text-gray-600 flex-1 truncate">
                    <span className="font-medium">Items:</span>{" "}
                    {order.items.map((item) => item.name).join(", ")}
                  </p>
                  <button
                    onClick={() => handleReorder(order)}
                    className="px-3 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex-shrink-0 ml-2"
                  >
                    Reorder
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}