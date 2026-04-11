import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Loader2, ChevronDown, ChevronUp,
  Clock, CheckCircle, MapPin, CheckCircle2, XCircle, ShoppingBag
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import { useCart } from "../context/CartContext";

const API_BASE = "http://localhost:8080/api";
const IMG_BASE = "http://localhost:8080";

const getImageUrl = (path) => {
  if (!path) return null;
  return path.startsWith("http") ? path : `${IMG_BASE}${path}`;
};

// ─── Updated Status Config ────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:          { label: "Pending",       color: "bg-yellow-500/10 text-yellow-600",   icon: Clock,        step: 0 },
  CONFIRMED:        { label: "Confirmed",     color: "bg-blue-500/10 text-blue-600",       icon: CheckCircle,  step: 1 },
  READY_FOR_PICKUP: { label: "Ready",         color: "bg-orange-500/10 text-orange-600",   icon: MapPin,       step: 2 },
  COMPLETED:        { label: "Collected",     color: "bg-emerald-500/10 text-emerald-600", icon: CheckCircle2, step: 3 },
  CANCELLED:        { label: "Cancelled",     color: "bg-red-500/10 text-red-500",         icon: XCircle,      step: -1 },
};

const STEPS = ["Pending", "Confirmed", "Ready", "Collected"];

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
              i <= currentStep ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
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
  const Icon = config.icon;

  // Assuming pickup details come from the first product in the order
  const pickupInfo = order.items?.[0]?.product;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Order #{order.id}</p>
            <p className="text-xs text-muted-foreground">
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-KE", {
                day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
              }) : "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
          <span className="text-sm font-bold text-foreground">{formatPrice(order.totalAmount ?? 0)}</span>
          <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-secondary rounded-full transition-colors">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="px-5 pb-4">
        <OrderProgress status={order.status} />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border bg-muted/30"
          >
            <div className="p-5 space-y-4">
              {/* Pickup Location Card (Visible when Ready) */}
              {order.status === "READY_FOR_PICKUP" && pickupInfo?.pickupLocation && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex gap-3">
                  <MapPin className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-orange-900">Collection Point</h4>
                    <p className="text-sm text-orange-800 mt-1">{pickupInfo.pickupLocation}</p>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupInfo.pickupLocation)}`}
                      target="_blank" rel="noreferrer"
                      className="text-xs font-bold text-orange-700 underline mt-2 inline-block"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Items in this order</p>
                {order.items?.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-card p-2 rounded-lg border border-border/50">
                    <div className="w-12 h-12 rounded-lg border border-border overflow-hidden bg-secondary">
                      {item.product?.images?.[0] ? (
                        <img src={getImageUrl(item.product.images[0])} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${item.product?.id}`} className="text-sm font-medium hover:text-primary transition-colors line-clamp-1">
                        {item.product?.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                    </div>
                    <p className="text-sm font-bold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const { toast } = useToast();
  const { formatPrice } = useCart();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("jwt_token");
    try {
      const res = await fetch(`${API_BASE}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setOrders(await res.json());
      else throw new Error();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not load orders." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const FILTERS = ["ALL", "PENDING", "CONFIRMED", "READY_FOR_PICKUP", "COMPLETED", "CANCELLED"];
  const filtered = filter === "ALL" ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
            <p className="text-muted-foreground">Track your marketplace collections</p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchOrders} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Refresh"}
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:border-primary/50"
              }`}
            >
              {f.replace(/_/g, " ")} ({filter === "ALL" ? orders.length : orders.filter(o => o.status === f).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
            <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-bold">No {filter !== "ALL" ? filter.toLowerCase() : ""} orders</h3>
            <Link to="/products" className="mt-4 inline-block text-primary font-bold hover:underline">Continue Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => <OrderCard key={order.id} order={order} formatPrice={formatPrice} />)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MyOrders;