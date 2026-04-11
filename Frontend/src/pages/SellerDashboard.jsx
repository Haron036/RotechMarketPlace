import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Package, DollarSign, TrendingUp, Star, CheckCircle,
  Loader2, Trash2, ShoppingBag, ChevronDown, MapPin
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import NewListingModal from "../components/NewListingModal";
import { useToast } from "../components/ui/use-toast";
import { useCart } from "../context/CartContext";

const API_BASE = "http://localhost:8080/api";
const IMG_BASE = "http://localhost:8080";

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${IMG_BASE}${path}`;
};

// ─── Status badge colors ──────────────────────────────────────────────────────
const STATUS_STYLES = {
  PENDING:          "bg-yellow-500/10 text-yellow-600",
  CONFIRMED:        "bg-blue-500/10 text-blue-600",
  READY_FOR_PICKUP: "bg-orange-500/10 text-orange-600",
  COMPLETED:        "bg-emerald-500/10 text-emerald-600",
  CANCELLED:        "bg-red-500/10 text-red-500",
};

// What transitions are allowed per status
const NEXT_STATUSES = {
  PENDING:          ["CONFIRMED",        "CANCELLED"],
  CONFIRMED:        ["READY_FOR_PICKUP", "CANCELLED"],
  READY_FOR_PICKUP: ["COMPLETED"],
  COMPLETED:        [],
  CANCELLED:        [],
};

const STATUS_LABELS = {
  PENDING:          "Pending",
  CONFIRMED:        "Confirmed",
  READY_FOR_PICKUP: "Ready for Pickup",
  COMPLETED:        "Completed",
  CANCELLED:        "Cancelled",
};

const SellerDashboard = () => {
  const [activeTab, setActiveTab]   = useState("listings");
  const [listings, setListings]     = useState([]);
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [sellerName, setSellerName] = useState("Seller");
  const { toast }       = useToast();
  const { formatPrice } = useCart();

  // ─── Fetch seller's products ──────────────────────────────────────────────
  const fetchMyProducts = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("jwt_token");
    try {
      const response = await fetch(`${API_BASE}/products/my-products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setListings(await response.json());
      } else if (response.status === 403) {
        toast({ variant: "destructive", title: "Access Denied", description: "Only sellers can view this page." });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not load listings." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // ─── Fetch seller's orders ────────────────────────────────────────────────
  const fetchSellerOrders = useCallback(async () => {
    setOrdersLoading(true);
    const token = localStorage.getItem("jwt_token");
    try {
      const response = await fetch(`${API_BASE}/orders/seller`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setOrders(await response.json());
      } else {
        toast({ variant: "destructive", title: "Error", description: "Could not load orders." });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not load orders." });
    } finally {
      setOrdersLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("user_session"));
    if (session?.name) setSellerName(session.name);
    fetchMyProducts();
    fetchSellerOrders();
  }, [fetchMyProducts, fetchSellerOrders]);

  // ─── Delete product ───────────────────────────────────────────────────────
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
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not delete listing." });
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Update order status ──────────────────────────────────────────────────
  const handleStatusUpdate = async (orderId, newStatus) => {
    const token = localStorage.getItem("jwt_token");
    setUpdatingId(orderId);
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setOrders((prev) =>
          prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
        );
        toast({
          title: "Order Updated",
          description: `Order #${orderId} marked as ${STATUS_LABELS[newStatus]}`,
        });
      } else {
        const err = await response.text();
        toast({ variant: "destructive", title: "Update Failed", description: err });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not update order." });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleProductAdded = (newProduct) => setListings((prev) => [newProduct, ...prev]);

  // ─── Stats ────────────────────────────────────────────────────────────────
  const completedOrders = orders.filter((o) =>
    ["CONFIRMED", "READY_FOR_PICKUP","SHIPPED", "DELIVERED", "COMPLETED"].includes(o.status)
  );
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
  const avgRating = listings.length > 0
    ? (listings.reduce((sum, p) => sum + (p.rating ?? 0), 0) / listings.length).toFixed(1)
    : "0.0";

  const stats = [
    { label: "Total Revenue",   value: formatPrice(totalRevenue), icon: DollarSign, change: `${completedOrders.length} orders` },
    { label: "Active Listings", value: listings.length,           icon: Package,    change: `+${listings.length}` },
    { label: "Total Stock",     value: listings.reduce((sum, p) => sum + (p.stock ?? 0), 0), icon: TrendingUp, change: "+live" },
    { label: "Avg Rating",      value: avgRating,                 icon: Star,       change: "+0.0" },
  ];

  // ─── Helper: build Google Maps URL ───────────────────────────────────────
  const buildMapsUrl = (lat, lng, address) => {
    if (lat && lng) {
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }
    if (address) {
      return `https://www.google.com/maps?q=${encodeURIComponent(address)}`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">

        {/* Header */}
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

        {/* Stats */}
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          {[
            { id: "listings", label: "My Listings", icon: Package },
            { id: "orders",   label: "Orders",      icon: ShoppingBag,
              badge: orders.filter(o => o.status === "CONFIRMED" || o.status === "PENDING").length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── LISTINGS TAB ───────────────────────────────────────────────────── */}
        {activeTab === "listings" && (
          <div className="rounded-xl bg-card border border-border overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-serif text-xl text-foreground">Your Active Listings</h3>
              <Button variant="ghost" size="sm" className="text-xs text-primary"
                onClick={fetchMyProducts} disabled={loading}>
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
                      {["Product", "Category", "Pickup Location", "Stock", "Status", "Price", "Actions"].map((h, i) => (
                        <th key={h} className={`text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4 ${i >= 5 ? "text-right" : "text-left"}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {listings.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-5 py-10 text-center text-sm text-muted-foreground italic">
                          No active listings found. Create one to get started!
                        </td>
                      </tr>
                    ) : listings.map((product) => {
                      const productMapsUrl = buildMapsUrl(
                        product.pickupLatitude,
                        product.pickupLongitude,
                        product.pickupLocation
                      );
                      return (
                        <tr key={product.id}
                          className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors group">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg border border-border overflow-hidden shrink-0 bg-secondary flex items-center justify-center">
                                {getImageUrl(product.images?.[0]) ? (
                                  <img src={getImageUrl(product.images[0])} alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.style.display = "none"; }} />
                                ) : (
                                  <Package className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <span className="text-sm font-bold text-foreground">{product.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-muted-foreground">{product.category || "General"}</td>

                          {/* Pickup Location */}
                          <td className="px-5 py-4">
                            {productMapsUrl ? (
                              <a 
                                href={productMapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 hover:underline max-w-[150px]"
                              >
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{product.pickupLocation}</span>
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Not set</span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-muted-foreground">{product.stock ?? 0} units</td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600">
                              Live
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm font-bold text-foreground text-right">
                            {formatPrice(product.price ?? 0)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Button variant="ghost" size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDelete(product.id)}
                              disabled={deletingId === product.id}>
                              {deletingId === product.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Trash2 className="w-4 h-4" />}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── ORDERS TAB ─────────────────────────────────────────────────────── */}
        {activeTab === "orders" && (
          <div className="rounded-xl bg-card border border-border overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-serif text-xl text-foreground">Customer Orders</h3>
              <Button variant="ghost" size="sm" className="text-xs text-primary"
                onClick={fetchSellerOrders} disabled={ordersLoading}>
                {ordersLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refresh"}
              </Button>
            </div>

            {ordersLoading ? (
              <div className="flex justify-center p-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground italic">
                No orders yet. Share your listings to start selling!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary/30 border-b border-border">
                      {["Order ID", "Date", "Items", "Pickup Location", "Total", "Status", "Action"].map((h, i) => (
                        <th key={h} className={`text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4 ${i >= 4 ? "text-right" : "text-left"}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const nextStatuses = NEXT_STATUSES[order.status] ?? [];
                      const firstProduct = order.items?.[0]?.product;
                      const mapsUrl = buildMapsUrl(
                        firstProduct?.pickupLatitude,
                        firstProduct?.pickupLongitude,
                        firstProduct?.pickupLocation
                      );

                      return (
                        <tr key={order.id}
                          className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">

                          {/* Order ID */}
                          <td className="px-5 py-4 text-sm font-bold text-foreground">
                            #{order.id}
                          </td>

                          {/* Date */}
                          <td className="px-5 py-4 text-sm text-muted-foreground">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString("en-KE", {
                                  day: "2-digit", month: "short", year: "numeric"
                                })
                              : "—"}
                          </td>

                          {/* Items */}
                          <td className="px-5 py-4 text-sm text-muted-foreground">
                            <div className="flex flex-col gap-0.5">
                              {order.items?.map((item, i) => (
                                <span key={i} className="text-xs">
                                  {item.quantity}× {item.product?.name ?? "Product"}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Pickup Location */}
                          <td className="px-5 py-4">
                            {mapsUrl ? (
                              <a 
                                href={mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 hover:underline"
                              >
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="max-w-[120px] truncate">
                                  {firstProduct?.pickupLocation ?? "View map"}
                                </span>
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">—</span>
                            )}
                          </td>

                          {/* Total */}
                          <td className="px-5 py-4 text-sm font-bold text-foreground text-right">
                            {formatPrice(order.totalAmount ?? 0)}
                          </td>

                          {/* Status Badge */}
                          <td className="px-5 py-4 text-right">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_STYLES[order.status] ?? "bg-secondary text-muted-foreground"}`}>
                              {STATUS_LABELS[order.status] ?? order.status}
                            </span>
                          </td>

                          {/* Action — dropdown of next valid statuses */}
                          <td className="px-5 py-4 text-right">
                            {nextStatuses.length > 0 ? (
                              <div className="relative inline-block">
                                <select
                                  className="text-xs border border-border rounded-lg px-3 py-1.5 bg-background text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none pr-7"
                                  defaultValue=""
                                  disabled={updatingId === order.id}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleStatusUpdate(order.id, e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                >
                                  <option value="" disabled>Update →</option>
                                  {nextStatuses.map((s) => (
                                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                  ))}
                                </select>
                                {updatingId === order.id
                                  ? <Loader2 className="w-3 h-3 animate-spin absolute right-2 top-2 text-muted-foreground" />
                                  : <ChevronDown className="w-3 h-3 absolute right-2 top-2 text-muted-foreground pointer-events-none" />
                                }
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
};

export default SellerDashboard;