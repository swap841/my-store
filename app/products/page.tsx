"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProductCard from "@/components/ProductCard";
import { Search } from "lucide-react";

// Product interface
interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  discountText?: string;
  imageUrl: string;
  weight: string;
  description: string;
  category: string;
  categoryId: string;
  brand: string;
}

// Category interface
interface Category {
  id: string;
  name: string;
  displayName: string;
  order: number;
  icon?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Fetch categories from Firestore - SIMPLIFIED AND DEBUGGED
  useEffect(() => {
    async function fetchCategories() {
      console.log("Starting to fetch categories...");
      setCategoriesLoading(true);
      try {
        // Try without ordering first to debug
        const categoriesRef = collection(db, "categories");
        console.log("Categories reference created");

        const snapshot = await getDocs(categoriesRef);
        console.log("Categories snapshot received:", snapshot.docs.length, "documents");

        const categoryList: Category[] = [];

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          console.log("Category document data:", {
            id: doc.id,
            data: data
          });

          categoryList.push({
            id: doc.id,
            name: data.name || "",
            displayName: data.displayName || data.name || "Uncategorized",
            order: data.order || 0,
            icon: data.icon
          });
        });

        console.log("Processed categories list:", categoryList);

        // Sort by order if order field exists
        if (categoryList.some(cat => cat.order !== 0)) {
          categoryList.sort((a, b) => a.order - b.order);
        }

        setCategories(categoryList);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        // Add fallback categories for testing
        console.log("Using fallback categories for testing");
        setCategories([
          { id: "1", name: "fruits", displayName: "Fruits", order: 1 },
          { id: "2", name: "vegetables", displayName: "Vegetables", order: 2 },
          { id: "3", name: "dairy", displayName: "Dairy", order: 3 },
          { id: "4", name: "bakery", displayName: "Bakery", order: 4 },
        ]);
      }
      setCategoriesLoading(false);
    }

    fetchCategories();
  }, []);

  // Fetch products from Firestore
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "products"));

        const productList: Product[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          const price = data.price || 0;

          let originalPrice;
          if (data.originalPrice !== undefined && data.originalPrice > price) {
            originalPrice = data.originalPrice;
          }

          return {
            id: doc.id,
            name: data.name || "Unknown Product",
            price: price,
            originalPrice: originalPrice,
            discountPercentage: data.discountPercentage,
            discountText: data.discountText,
            imageUrl: data.imageUrl || "/placeholder-image.jpg",
            weight: data.weight || "",
            description: data.description || "",
            category: data.category || "",
            categoryId: data.category || "",
            brand: data.brand || ""
          };
        });

        setProducts(productList);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(searchLower) ||
      (product.description && product.description.toLowerCase().includes(searchLower)) ||
      (product.brand && product.brand.toLowerCase().includes(searchLower));

    // Category filter
    let matchesCategory = false;
    if (selectedCategory === "all") {
      matchesCategory = true;
    } else {
      // Match by category ID
      matchesCategory = product.category === selectedCategory;
    }

    return matchesSearch && matchesCategory;
  });

  // Get selected category name for display
  const selectedCategoryName = selectedCategory === "all"
    ? "All Products"
    : categories.find(cat => cat.id === selectedCategory)?.displayName || selectedCategory;

  // Get product count for each category
  const getProductCountForCategory = (categoryId: string) => {
    return products.filter(product => product.category === categoryId).length;
  };

  // Create default categories if none are loaded
  const displayCategories = categories.length > 0 ? categories : [
    { id: "fruits", name: "fruits", displayName: "Fruits", order: 1 },
    { id: "vegetables", name: "vegetables", displayName: "Vegetables", order: 2 },
    { id: "dairy", name: "dairy", displayName: "Dairy", order: 3 },
    { id: "bakery", name: "bakery", displayName: "Bakery", order: 4 },
    { id: "beverages", name: "beverages", displayName: "Beverages", order: 5 },
    { id: "snacks", name: "snacks", displayName: "Snacks", order: 6 },
  ];

  // Visible categories (show all or first 6)
  const visibleCategories = showAllCategories
    ? displayCategories
    : displayCategories.slice(0, 6);

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    // No change here, container is responsive
    <div className="min-h-screen bg-white">
      {/* Search and Categories Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-3 py-2">
          {/* Search Bar */}
          <div className="mb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder='Search "apple, fruits, snacks..."'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mt-2">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {/* "All" category option */}
              <button
                onClick={() => handleCategorySelect("all")}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium flex-shrink-0 transition-colors ${
                  selectedCategory === "all"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({products.length})
              </button>

              {/* Dynamic categories */}
              {visibleCategories.map((category) => {
                const productCount = getProductCountForCategory(category.id);

                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium flex-shrink-0 transition-colors flex items-center gap-1 ${
                      selectedCategory === category.id
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {category.icon && <span>{category.icon}</span>}
                    {category.displayName}
                    <span className={`text-xs ${selectedCategory === category.id ? 'text-green-100' : 'text-gray-500'}`}>
                      ({productCount})
                    </span>
                  </button>
                );
              })}

              {/* Show More/Less button if there are more than 6 categories */}
              {displayCategories.length > 6 && (
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium flex-shrink-0 bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  {showAllCategories ? "Less" : `+${displayCategories.length - 6} more`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 py-3">
        {/* Category Title and Product Count */}
        <div className="mb-3">
          <h1 className="text-lg font-bold text-gray-900">{selectedCategoryName}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
            {searchTerm && ` for "${searchTerm}"`}
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <ProductGridSkeleton />
        ) : (
          <>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-gray-400 mb-2">
                  <Search size={32} className="mx-auto" />
                </div>
                <p className="text-gray-600 text-sm">No products found</p>
                <p className="text-xs text-gray-400 mt-1">
                  {searchTerm
                    ? `No results for "${searchTerm}" in ${selectedCategoryName.toLowerCase()}`
                    : `Try selecting a different category`
                  }
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="mt-3 px-4 py-1.5 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              // CRITICAL FIX: The grid is already responsive and will automatically use ProductCard's w-full
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {filteredProducts.map((product) => {
                  // Find category name for this product
                  const productCategory = displayCategories.find(cat => cat.id === product.category);
                  const categoryName = productCategory?.name || "Uncategorized";

                  return (
                    <ProductCard
                      key={product.id}
                      product={{
                        ...product,
                        category: categoryName
                      }}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Loading Skeleton Component
function ProductGridSkeleton() {
  return (
    // CRITICAL FIX: The grid is already responsive and will fill width appropriately
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="aspect-square bg-gray-100 animate-pulse relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full mb-1"></div>
              <div className="h-2 w-10 bg-gray-200 rounded"></div>
            </div>
          </div>

          <div className="p-2 sm:p-3"> {/* CRITICAL FIX: Reduced mobile padding to p-2 */}
            <div className="h-3 bg-gray-200 rounded mb-1.5 animate-pulse"></div>
            <div className="h-2.5 bg-gray-200 rounded w-4/5 mb-2 animate-pulse"></div>

            <div className="flex items-center gap-1 mb-2">
              <div className="h-3 w-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-2.5 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="h-7 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}