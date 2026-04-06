import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Package, Loader2, ChevronDown, ChevronUp,
  Clock, CheckCircle, Truck, XCircle, Star
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import { useCart } from "../context/CartContext";

const API_BASE  = "http://localhost:8080/api";
const IMG_BASE  = "http://localhost:8080";

const getImageUrl = (path) => {
  if (!path) return null;
  return path.startsWith("http") ? path : `${IMG_BASE}${path}`;
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:   { label: "Pending",   color: "bg-yellow-500/10 text-yellow-600",  icon: Clock,         step: 0 },
  CONFIRMED: { label: "Confirmed", color: "bg-blue-500/10 text-blue-600",      icon: CheckCircle,   step: 1 },
  SHIPPED:   { label: "Shipped",   color: "bg-purple-500/10 text-purple-600",  icon: Truck,         step: 2 },
  DELIVERED: { label: "Delivered", color: "bg-emerald-500/10 text-emerald-600",icon: Star,          step: 3 },
  COMPLETED: { label: "Completed", color: "bg-emerald-500/10 text-emerald-600",icon: Star,          step: 3 },
  CANCELLED: { label: "Cancelled", color: "bg-red-500/10 text-red-500",        icon: XCircle,       step: -1 },
};

const STEPS = ["Pending", "Confirmed", "Shipped", "Delivered"];

// ─── Order Progress Bar ───────────────────────────────────────────────────────
const OrderProgress = ({ status }) => {
  if (status === "CANCELLED") return null;
  const currentStep = STATUS_CONFIG[status]?.step ?? 0;

  return (
    <div className="flex items-center gap-0 mt-4 mb-2">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i <= currentStep
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}>
              {i < currentStep ? "✓" : i + 1}
            </div>
            <span className={`text-[10px] mt-1 font-medium ${
              i <= currentStep ? "text-primary" : "text-muted-foreground"
            }`}>
              {step}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 flex-1 mx-1 mb-4 transition-all ${
              i < currentStep ? "bg-primary" : "bg-border"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Single Order Card ────────────────────────────────────────────────────────
const OrderCard = ({ order, formatPrice }) => {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
  const Icon   = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* ── Card Header ── */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Order #{order.id}</p>
            <p className="text-xs text-muted-foreground">
              {order.createdAt
                ? new Date(order.createdAt).toLocaleDateString("en-KE", {
                    day: "2-digit", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit"
                  })
                : "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${config.color}`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>

          {/* Total */}
          <span className="text-sm font-bold text-foreground">
            {formatPrice(order.totalAmount ?? 0)}
          </span>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded((p) => !p)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded
              ? <ChevronUp className="w-4 h-4" />
              : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Progress Bar (always visible) ── */}
      <div className="px-5 pb-2">
        <OrderProgress status={order.status} />
      </div>

      {/* ── Expanded: Item details ── */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-border"
        >
          <div className="p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Items in this order
            </p>
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                {/* Product image */}
                <div className="w-12 h-12 rounded-lg border border-border overflow-hidden bg-secondary flex-shrink-0">
                  {getImageUrl(item.product?.images?.[0]) ? (
                    <img
                      src={getImageUrl(item.product.images[0])}
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.product?.id}`}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                  >
                    {item.product?.name ?? "Product"}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity} · {formatPrice(item.price)} each
                  </p>
                </div>

                <p className="text-sm font-bold text-foreground flex-shrink-0">
                  {formatPrice((item.price ?? 0) * (item.quantity ?? 1))}
                </p>
              </div>
            ))}

            {/* Order summary footer */}
            <div className="border-t border-border pt-3 flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {order.items?.length ?? 0} item{order.items?.length !== 1 ? "s" : ""}
              </p>
              <p className="text-sm font-bold text-foreground">
                Total: {formatPrice(order.totalAmount ?? 0)}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const MyOrders = () => {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("ALL");
  const { toast }             = useToast();
  const { formatPrice }       = useCart();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("jwt_token");
    try {
      const res = await fetch(`${API_BASE}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOrders(await res.json());
      } else {
        toast({ variant: "destructive", title: "Error", description: "Could not load your orders." });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not load your orders." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const FILTERS = ["ALL", "PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

  const filtered = filter === "ALL"
    ? orders
    : orders.filter((o) => o.status === filter);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-serif text-3xl text-foreground">My Orders</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track and manage your purchases
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {f === "ALL" ? `All (${orders.length})` : `${f} (${orders.filter(o => o.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-14 h-14 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="font-serif text-2xl text-foreground mb-2">No orders found</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {filter === "ALL"
                ? "You haven't placed any orders yet."
                : `No ${filter.toLowerCase()} orders.`}
            </p>
            <Link to="/products">
              <Button className="marketplace-gradient border-0 text-primary-foreground">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} formatPrice={formatPrice} />
            ))}
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
};

export default MyOrders;