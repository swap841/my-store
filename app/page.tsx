export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-green-600">My Grocery Store 🛒</h1>
        <p className="text-gray-600 mt-2">Fresh groceries delivered to your home</p>
      </header>

      {/* Banner */}
      <div className="w-full h-48 bg-green-500 rounded-xl flex items-center justify-center text-white text-2xl font-semibold">
        Fresh & Fast Delivery 🚚
      </div>

      {/* Categories */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Categories</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow text-center font-medium">Vegetables 🥦</div>
          <div className="bg-white p-4 rounded-xl shadow text-center font-medium">Fruits 🍎</div>
          <div className="bg-white p-4 rounded-xl shadow text-center font-medium">Snacks 🍪</div>
          <div className="bg-white p-4 rounded-xl shadow text-center font-medium">Drinks 🥤</div>
        </div>
      </section>

      {/* Start Shopping Button */}
      <div className="mt-10 flex justify-center">
        <a
          href="/products"
          className="px-6 py-3 bg-green-600 text-white rounded-full text-lg font-semibold shadow hover:bg-green-700"
        >
          Start Shopping →
        </a>
      </div>
    </div>
  );
}
