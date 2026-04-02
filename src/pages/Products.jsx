import { useState, useEffect, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { categories } from "../lib/mock-data.js"; // keep using static categories

const API_BASE = "http://localhost:8080/api";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState("relevance");

  // ─── Fetch products from backend ─────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategory) params.append("category", selectedCategory);

      const response = await fetch(
        `${API_BASE}/products${params.toString() ? `?${params}` : ""}`
      );

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  // Re-fetch whenever search or category changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ─── Debounce search input ────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 400); // wait 400ms after user stops typing
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ─── Client-side sort (backend returns unordered) ─────────
  const sorted = [...products].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
    return 0;
  });

  // ─── Category click: clear search, set category ──────────
  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setSearchInput("");
    setSearch("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Sidebar */}
          <aside className="md:w-56 shrink-0 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => handleCategorySelect(null)}
                  className={`block w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${
                    !selectedCategory
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.name)} // use name to match backend
                    className={`block w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${
                      selectedCategory === cat.name
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground"
              >
                <option value="relevance">Relevance</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Product count */}
            <p className="text-sm text-muted-foreground mb-4">
              {loading ? "Loading..." : `${sorted.length} products found`}
            </p>

            {/* Loading state */}
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {sorted.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </div>

                {sorted.length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-muted-foreground">
                      No products found. Try adjusting your filters.
                    </p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Products;