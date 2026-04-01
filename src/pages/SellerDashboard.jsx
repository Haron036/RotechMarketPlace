import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, DollarSign, TrendingUp, Star, CheckCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import NewListingModal from "../components/NewListingModal";

const SellerDashboard = () => {
  const [seller, setSeller] = useState({ name: "Seller" });
  const [activeListings, setActiveListings] = useState(24);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("user_session"));
    if (session?.name) setSeller(session);
  }, []);

  const stats = [
    { label: "Total Sales", value: "$12,450", icon: DollarSign, color: "text-emerald-500" },
    { label: "Active Listings", value: activeListings, icon: Package, color: "text-blue-500" },
    { label: "Avg Rating", value: "4.8", icon: Star, color: "text-amber-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-serif">Seller Dashboard</h1>
            <p className="text-muted-foreground flex items-center gap-2">Welcome, {seller.name} <CheckCircle className="w-4 h-4 text-primary" /></p>
          </div>
          <NewListingModal onProductAdded={() => setActiveListings(prev => prev + 1)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border shadow-sm">
              <s.icon className={`w-6 h-6 ${s.color} mb-4`} />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SellerDashboard;