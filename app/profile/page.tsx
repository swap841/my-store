"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getAuth, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { db } from "@/src/lib/firebase"; // Assuming your Firestore instance
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  setDoc,
  Timestamp, // Required for reorder date
} from "firebase/firestore";

// --- Type Definitions ---
type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  // Ensure date can handle both Timestamp and a structure with seconds
  date: Timestamp | { seconds: number }; 
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "dispatched" | "delivered";
  deliveryAddress: string;
  phone?: string;
};

type CustomerData = {
  name: string;
  phone: string;
  address: string;
  geolocation: string;
};

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
        // Fallback: Use Firebase Auth name if user doc doesn't exist
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
      }
    });
    return () => unsubscribe();
  }, [auth]);

  // --- Effect 2: Order State Listener ---
  useEffect(() => {
    if (!user) return;

    // Listen to the orders subcollection for the current user
    const ordersRef = collection(db, "users", user.uid, "orders");
    const q = query(ordersRef, orderBy("date", "desc"));

    const unsubscribeOrders = onSnapshot(q, (snapshot) => {
      const orders: Order[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        
        // Ensure date field is handled correctly, prioritizing Firestore Timestamp
        let dateValue: Timestamp | { seconds: number } = data.date;
        if (data.date && data.date.seconds) {
            dateValue = { seconds: data.date.seconds };
        } else if (data.date instanceof Date) {
            // Handle if it was incorrectly saved as a JS Date
            dateValue = { seconds: data.date.getTime() / 1000 };
        } else {
            // Fallback for empty/bad date
            dateValue = { seconds: Date.now() / 1000 }; 
        }

        return {
          id: doc.id,
          // Cast the rest of the data
          ...(data as Omit<Order, "id" | "date">),
          date: dateValue, // Use the processed date
        } as Order;
      });
      
      setCurrentOrders(
        orders.filter((o) => o.status === "pending" || o.status === "dispatched")
      );
      setPastOrders(orders.filter((o) => o.status === "delivered"));
    }, (error) => {
        console.error("Error fetching orders:", error);
    });

    return () => unsubscribeOrders();
  }, [user]);

  // --- Handlers ---

  const handleLogout = async () => {
    await signOut(auth);
    router.push("//");
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
        date: Timestamp.now(), // Use Timestamp for consistent saving
        deliveryAddress: customerData.address || "",
        phone: customerData.phone || "",
      });
      alert("Order placed again!");
    } catch (err) {
      console.error("Error reordering:", err);
    }
  };

  // --- Render ---

  if (!user)
    return (
      <div className="p-8 text-center">
        <p>Please login to view your profile.</p>
      </div>
    );

  return (
    <div className="p-8 mt-20 max-w-7xl mx-auto flex gap-8">
      {/* Left: Profile Edit */}
      <div className="w-1/3 bg-white shadow-md rounded-lg p-6 flex flex-col items-center">
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
        
        {/* Email, Phone, Address Inputs (unchanged) */}
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
          />
        </div>
        <div className="flex gap-4 mt-2">
          <button
            onClick={handleSaveProfile}
            className="px-6 py-2 bg-green-600 text-white rounded-lg"
          >
            Save
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-500 text-white rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Right: Orders Display */}
      <div className="w-2/3 flex flex-col gap-6">
        {/* Current Orders */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Current Orders</h2>
          {currentOrders.length === 0 ? (
            <p>No pending orders.</p>
          ) : (
            <div className="space-y-4">
              {currentOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 border rounded-lg shadow hover:shadow-md transition"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p>
                      <strong>Order ID:</strong> {order.id}
                    </p>
                    <span
                      className={`px-3 py-1 rounded-full text-white ${
                        order.status === "pending"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      }`}
                    >
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">
                    <strong>Date:</strong>{" "}
                    {/* Access date using seconds property */}
                    {new Date(order.date.seconds * 1000).toLocaleString()}
                  </p>
                  <p className="text-gray-600 mb-2">
                    <strong>Delivery Address:</strong> {order.deliveryAddress}
                  </p>
                  <p className="text-gray-800 font-semibold mb-2">
                    Total: ₹{order.totalAmount}
                  </p>
                  <div>
                    <p className="font-semibold">Items:</p>
                    <ul className="list-disc ml-5">
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          {item.name} x {item.quantity} - ₹{item.price}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Previous Orders */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Previous Orders</h2>
          {pastOrders.length === 0 ? (
            <p>No previous orders.</p>
          ) : (
            <div className="space-y-4">
              {pastOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 border rounded-lg shadow hover:shadow-md transition bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p>
                      <strong>Order ID:</strong> {order.id}
                    </p>
                    <span className="px-3 py-1 rounded-full text-white bg-green-500">
                      DELIVERED
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">
                    <strong>Date:</strong>{" "}
                    {new Date(order.date.seconds * 1000).toLocaleString()}
                  </p>
                  <p className="text-gray-600 mb-2">
                    <strong>Delivery Address:</strong> {order.deliveryAddress}
                  </p>
                  <p className="text-gray-800 font-semibold mb-2">
                    Total: ₹{order.totalAmount}
                  </p>
                  <div>
                    <p className="font-semibold">Items:</p>
                    <ul className="list-disc ml-5 mb-2">
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          {item.name} x {item.quantity} - ₹{item.price}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleReorder(order)}
                      className="px-4 py-1 bg-green-600 text-white rounded-lg"
                    >
                      Order Again
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}