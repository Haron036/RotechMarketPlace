import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Package, DollarSign, TrendingUp, Star, CheckCircle, Loader2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import NewListingModal from "../components/NewListingModal";

const SellerDashboard = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sellerName, setSellerName] = useState("Seller");

  // 1. Fetch products belonging to the logged-in user
  const fetchMyProducts = useCallback(async () => {
    const token = localStorage.getItem("jwt_token");
    try {
      const response = await fetch("http://localhost:8080/api/products/my-products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setListings(data);
      }
    } catch (error) {
      console.error("Error fetching seller products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("user_session"));
    if (session?.name) setSellerName(session.name);
    fetchMyProducts();
  }, [fetchMyProducts]);

  // 2. Calculate dynamic stats
  const stats = [
    { label: "Total Sales", value: "$0.00", icon: DollarSign, change: "+0%" },
    { label: "Active Listings", value: listings.length, icon: Package, change: listings.length > 0 ? "+1" : "0" },
    { label: "Views This Month", value: "0", icon: TrendingUp, change: "+0%" },
    { label: "Avg Rating", value: "5.0", icon: Star, change: "+0.0" },
  ];

  // 3. Handle UI update after modal submission
  const handleProductAdded = (newProduct) => {
    setListings((prev) => [newProduct, ...prev]);
  };

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

        {/* Listings / Recent Activity Table */}
        <div className="rounded-xl bg-card border border-border overflow-hidden shadow-sm">
          <div className="p-5 border-b border-border flex justify-between items-center">
            <h3 className="font-serif text-xl text-foreground">Your Active Listings</h3>
            <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={fetchMyProducts}>
              Refresh
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
                  </tr>
                </thead>
                <tbody>
                  {listings.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-10 text-center text-sm text-muted-foreground italic">
                        No active listings found. Create one to get started!
                      </td>
                    </tr>
                  ) : (
                    listings.map((product) => (
                      <tr key={product.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors group">
                        <td className="px-5 py-4 text-sm font-bold text-foreground">
                          {product.name}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          {product.category || "General"}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {product.stock} units
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter bg-emerald-500/10 text-emerald-600">
                            Live
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-foreground text-right">
                          ${product.price.toFixed(2)}
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