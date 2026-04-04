import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Package, DollarSign, TrendingUp, Star, CheckCircle, Loader2, Trash2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import NewListingModal from "../components/NewListingModal";
import { useToast } from "../components/ui/use-toast";
import { useCart } from "../context/CartContext";

const API_BASE = "http://localhost:8080/api";
const IMG_BASE = "http://localhost:8080";

// Safely resolves a stored image path to a full URL
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${IMG_BASE}${path}`;
};

const SellerDashboard = () => {
  const [listings, setListings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [sellerName, setSellerName] = useState("Seller");
  const { toast }       = useToast();
  const { formatPrice } = useCart();

  // ─── Fetch seller's products ──────────────────────────────
  const fetchMyProducts = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("jwt_token");
    try {
      const response = await fetch(`${API_BASE}/products/my-products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setListings(data);
      } else if (response.status === 403) {
        toast({ variant: "destructive", title: "Access Denied", description: "Only sellers can view this page." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not load listings." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("user_session"));
    if (session?.name) setSellerName(session.name);
    fetchMyProducts();
  }, [fetchMyProducts]);

  // ─── Soft-delete a product ────────────────────────────────
  const handleDelete = async (productId) => {
    const token = localStorage.getItem("jwt_token");
    setDeletingId(productId);
    try {
      const response = await fetch(`${API_BASE}/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setListings((prev) => prev.filter((p) => p.id !== productId));
        toast({ title: "Deleted", description: "Listing removed successfully." });
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete listing." });
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Handle new product added from modal ──────────────────
  const handleProductAdded = (newProduct) => {
    setListings((prev) => [newProduct, ...prev]);
  };

  // ─── Compute dynamic stats from real data ─────────────────
  const totalRevenueUSD = listings.reduce((sum, p) => sum + (p.price ?? 0), 0);
  const avgRating =
    listings.length > 0
      ? (listings.reduce((sum, p) => sum + (p.rating ?? 0), 0) / listings.length).toFixed(1)
      : "0.0";

  const stats = [
    {
      label:  "Total Revenue",
      value:  formatPrice(totalRevenueUSD),
      icon:   DollarSign,
      change: listings.length > 0 ? "+active" : "0",
    },
    {
      label:  "Active Listings",
      value:  listings.length,
      icon:   Package,
      change: listings.length > 0 ? `+${listings.length}` : "0",
    },
    {
      label:  "Total Stock",
      value:  listings.reduce((sum, p) => sum + (p.stock ?? 0), 0),
      icon:   TrendingUp,
      change: "+live",
    },
    {
      label:  "Avg Rating",
      value:  avgRating,
      icon:   Star,
      change: "+0.0",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-serif text-3xl text-foreground">Seller Dashboard</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">Welcome back, {sellerName}</p>
              <CheckCircle className="w-3 h-3 text-primary" />
            </div>
          </div>

          <NewListingModal onProductAdded={handleProductAdded} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl bg-card border border-border p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="w-5 h-5 text-primary" />
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {stat.change}
                </span>
              </div>
              <p className="font-serif text-2xl text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Listings Table */}
        <div className="rounded-xl bg-card border border-border overflow-hidden shadow-sm">
          <div className="p-5 border-b border-border flex justify-between items-center">
            <h3 className="font-serif text-xl text-foreground">Your Active Listings</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary"
              onClick={fetchMyProducts}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refresh"}
            </Button>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center p-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary/30 border-b border-border">
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4">Product</th>
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4">Category</th>
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4">Stock</th>
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4">Status</th>
                    <th className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4">Price</th>
                    <th className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-10 text-center text-sm text-muted-foreground italic">
                        No active listings found. Create one to get started!
                      </td>
                    </tr>
                  ) : (
                    listings.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors group"
                      >
                        {/* Product Name + Thumbnail */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg border border-border overflow-hidden flex-shrink-0 bg-secondary flex items-center justify-center">
                              {getImageUrl(product.images?.[0]) ? (
                                <img
                                  src={getImageUrl(product.images[0])}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.parentElement.innerHTML =
                                      `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`;
                                  }}
                                />
                              ) : (
                                <Package className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                            <span className="text-sm font-bold text-foreground">{product.name}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          {product.category || "General"}
                        </td>

                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {product.stock ?? 0} units
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter bg-emerald-500/10 text-emerald-600">
                            Live
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm font-bold text-foreground text-right">
                          {formatPrice(product.price ?? 0)}
                        </td>

                        {/* Delete Action */}
                        <td className="px-5 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDelete(product.id)}
                            disabled={deletingId === product.id}
                          >
                            {deletingId === product.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />
                            }
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SellerDashboard;