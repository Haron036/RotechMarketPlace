import { Link, useNavigate } from "react-router-dom";
import { Trash2, ArrowLeft, ShoppingCart as CartIcon, Loader2, CreditCard, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";

const SERVER_URL = "http://localhost:8080";
const API_BASE = `${SERVER_URL}/api`;

// ─── Payment Method Icons ─────────────────────────────────
const PaymentIcons = {
  STRIPE: () => (
    <svg viewBox="0 0 60 25" className="h-5" fill="none">
      <path d="M5 10.5C5 8 6.5 6.5 9 6.5c1.8 0 3.2.8 4 2l2-1.5C13.8 4.8 11.6 4 9 4 5 4 2 7 2 10.5S5 17 9 17c2.6 0 4.8-.8 6-2.8l-2-1.5c-.8 1.2-2.2 2-4 2-2.5 0-4-1.5-4-4.2z" fill="#635BFF"/>
      <path d="M22 4c-3.3 0-5.5 1.5-5.5 4 0 4.5 6.5 3.5 6.5 5.5 0 1-.8 1.5-2 1.5-1.5 0-2.8-.8-3.5-2l-2 1.5C16.5 16.2 18.5 17 21 17c3.2 0 5.5-1.5 5.5-4.2 0-4.3-6.5-3.5-6.5-5.3 0-.8.8-1.3 1.8-1.3 1.2 0 2.2.5 3 1.5l2-1.5C25.8 4.8 24 4 22 4z" fill="#635BFF"/>
    </svg>
  ),
  PAYPAL: () => (
    <svg viewBox="0 0 100 32" className="h-5" fill="none">
      <path d="M12 4h10c5 0 8 2.5 7 7.5C28 17 24 20 19 20h-3l-1.5 8H8L12 4z" fill="#003087"/>
      <path d="M20 4h10c5 0 8 2.5 7 7.5C36 17 32 20 27 20h-3l-1.5 8H16L20 4z" fill="#009CDE"/>
    </svg>
  ),
  MPESA: () => (
    <span className="text-green-600 font-black text-sm tracking-tight">M-PESA</span>
  ),
};

const Cart = () => {
  const { items, removeFromCart, updateQuantity, totalPrice, formatPrice, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [checkingOut, setCheckingOut] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvc: "" });

  const paymentMethods = [
    { id: "STRIPE", label: "Card Payment", desc: "Visa, Mastercard, Amex" },
    { id: "PAYPAL", label: "PayPal", desc: "Pay with your PayPal account" },
    { id: "MPESA",  label: "M-Pesa", desc: "Safaricom STK Push" },
  ];

  const getSellerName = (product) =>
    product.seller?.name ?? product.seller?.email?.split("@")[0] ?? "Unknown Seller";

  const getImage = (product) => {
    const path = product.images?.[0];
    if (!path) return "/placeholder.jpg";
    return path.startsWith("http") ? path : `${SERVER_URL}${path}`;
  };

  // ─── Initiate checkout ────────────────────────────────────
  const handleCheckout = async () => {
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      toast({ variant: "destructive", title: "Sign in required", description: "Please log in to proceed." });
      return navigate("/auth");
    }
    if (!selectedMethod) {
      toast({ variant: "destructive", title: "Select a payment method", description: "Please choose how you'd like to pay." });
      return;
    }
    if (selectedMethod === "MPESA" && !mpesaPhone) {
      toast({ variant: "destructive", title: "Phone required", description: "Enter your M-Pesa phone number." });
      return;
    }

    setCheckingOut(true);
    try {
      const payload = {
        paymentMethod: selectedMethod,
        amount: totalPrice,
        currency: "USD",
        phoneNumber: mpesaPhone,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
      };

      const response = await fetch(`${API_BASE}/payments/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data || "Payment failed");

      // ── Handle each payment method response ──────────────
      if (selectedMethod === "STRIPE") {
        setStripeClientSecret(data.clientSecret);
        toast({ title: "Almost there!", description: "Complete your card payment below." });
      }

      if (selectedMethod === "PAYPAL") {
        toast({ title: "Redirecting to PayPal...", description: "You will be redirected shortly." });
        setTimeout(() => window.open(data.redirectUrl, "_blank"), 1000);
        clearCart();
        navigate("/");
      }

      if (selectedMethod === "MPESA") {
        toast({ title: "Check your phone!", description: data.message });
        clearCart();
        setShowPaymentModal(false);
        navigate("/");
      }

    } catch (error) {
      toast({ variant: "destructive", title: "Payment Failed", description: error.message });
    } finally {
      setCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <CartIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h1 className="font-serif text-3xl text-foreground mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground text-sm mb-6">Discover unique products from around the world</p>
          <Link to="/products">
            <Button className="marketplace-gradient border-0 text-primary-foreground">Browse Products</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </Link>

        <h1 className="font-serif text-3xl text-foreground mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, i) => (
              <motion.div
                key={item.product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-4 p-4 rounded-xl bg-card border border-border"
              >
                <Link to={`/product/${item.product.id}`} className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                  <img src={getImage(item.product)} alt={item.product.name} className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = "/placeholder.jpg"; }} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.product.id}`} className="text-sm font-medium text-foreground hover:text-primary line-clamp-1">
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{getSellerName(item.product)}</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{formatPrice(item.product.price)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Subtotal: {formatPrice(item.product.price * item.quantity)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => removeFromCart(item.product.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center border border-border rounded-md">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="px-2 py-1 text-xs hover:bg-secondary">-</button>
                    <span className="px-2 text-xs font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= (item.product.stock ?? 99)}
                      className="px-2 py-1 text-xs hover:bg-secondary disabled:opacity-40">+</button>
                  </div>
                </div>
              </motion.div>
            ))}
            <div className="flex justify-end">
              <button onClick={clearCart} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Clear cart</button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-xl bg-card border border-border p-6 sticky top-24 space-y-4">
              <h3 className="font-serif text-xl text-foreground">Order Summary</h3>

              <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-muted-foreground">
                    <span className="truncate max-w-[60%]">{item.product.name} × {item.quantity}</span>
                    <span>{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm border-t border-border pt-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span><span className="text-emerald-600 font-medium">Free</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold text-foreground">
                  <span>Total</span><span>{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <Button
                onClick={() => setShowPaymentModal(true)}
                className="w-full marketplace-gradient border-0 text-primary-foreground"
                size="lg"
              >
                <CreditCard className="w-4 h-4 mr-2" /> Proceed to Checkout
              </Button>

              <p className="text-[10px] text-center text-muted-foreground">
                Secure checkout · Buyer protection included
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Payment Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowPaymentModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="font-serif text-2xl text-foreground mb-1">Choose Payment</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Total: <span className="font-bold text-foreground">{formatPrice(totalPrice)}</span>
              </p>

              {/* Payment Method Selection */}
              <div className="space-y-3 mb-6">
                {paymentMethods.map((method) => {
                  const Icon = PaymentIcons[method.id];
                  return (
                    <button
                      key={method.id}
                      onClick={() => { setSelectedMethod(method.id); setStripeClientSecret(null); }}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        selectedMethod === method.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="w-16 flex items-center justify-center">
                        <Icon />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{method.label}</p>
                        <p className="text-xs text-muted-foreground">{method.desc}</p>
                      </div>
                      <div className={`ml-auto w-4 h-4 rounded-full border-2 transition-all ${
                        selectedMethod === method.id ? "border-primary bg-primary" : "border-border"
                      }`} />
                    </button>
                  );
                })}
              </div>

              {/* M-Pesa Phone Input */}
              <AnimatePresence>
                {selectedMethod === "MPESA" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden"
                  >
                    <label className="text-xs font-medium text-foreground block mb-1.5">
                      M-Pesa Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 0712345678"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      You will receive an STK push prompt on this number.
                    </p>
                  </motion.div>
                )}

                {/* Stripe Card Input */}
                {selectedMethod === "STRIPE" && !stripeClientSecret && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden space-y-3"
                  >
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1.5">Card Number</label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        value={cardDetails.number}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();
                          setCardDetails(p => ({ ...p, number: val }));
                        }}
                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-foreground block mb-1.5">Expiry</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardDetails.expiry}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").replace(/^(\d{2})(\d)/, "$1/$2");
                            setCardDetails(p => ({ ...p, expiry: val }));
                          }}
                          className="w-full px-4 py-2.5 rounded-lg bg-secondary border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground block mb-1.5">CVC</label>
                        <input
                          type="text"
                          placeholder="123"
                          maxLength={4}
                          value={cardDetails.cvc}
                          onChange={(e) => setCardDetails(p => ({ ...p, cvc: e.target.value.replace(/\D/g, "") }))}
                          className="w-full px-4 py-2.5 rounded-lg bg-secondary border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={checkingOut}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 marketplace-gradient border-0 text-primary-foreground"
                  onClick={handleCheckout}
                  disabled={checkingOut || !selectedMethod}
                >
                  {checkingOut
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
                    : selectedMethod === "MPESA" ? <><Smartphone className="w-4 h-4 mr-2" />Pay via M-Pesa</>
                    : selectedMethod === "PAYPAL" ? "Pay with PayPal"
                    : selectedMethod === "STRIPE" ? <><CreditCard className="w-4 h-4 mr-2" />Pay Now</>
                    : "Pay Now"
                  }
                </Button>
              </div>

              <p className="text-[10px] text-center text-muted-foreground mt-3">
                🔒 Secured by 256-bit SSL encryption
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default Cart;