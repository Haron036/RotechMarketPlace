import { Link, useNavigate } from "react-router-dom";
import { Trash2, ArrowLeft, ShoppingCart as CartIcon, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";

const SERVER_URL = "http://localhost:8080";
const API_BASE = `${SERVER_URL}/api`;

const Cart = () => {
  const { items, removeFromCart, updateQuantity, totalPrice, formatPrice, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);

  // ─── Safely resolve seller name ───────────────────────────
  const getSellerName = (product) =>
    product.seller?.name ??
    product.seller?.email?.split("@")[0] ??
    "Unknown Seller";

  // ─── Safely resolve image with Backend Support ─────────────
  const getImage = (product) => {
    const path = product.images?.[0];
    if (!path) return "/placeholder.jpg";
    // If it's a full URL (like ui-avatars), return as is. 
    // Otherwise, prepend the server URL.
    return path.startsWith("http") ? path : `${SERVER_URL}${path}`;
  };

  // ─── Checkout handler ─────────────────────────────────────
  const handleCheckout = async () => {
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      toast({
        variant: "destructive",
        title: "Sign in required",
        description: "Please log in to proceed to checkout.",
      });
      return navigate("/auth");
    }

    setCheckingOut(true);
    try {
      // Build order payload
      const orderPayload = {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        totalAmount: totalPrice,
      };

      const response = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      if (response.ok) {
        clearCart();
        toast({
          title: "Order Placed!",
          description: "Your order has been placed successfully.",
        });
        navigate("/");
      } else {
        const error = await response.text();
        throw new Error(error || "Checkout failed");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Checkout Failed",
        description: error.message,
      });
    } finally {
      setCheckingOut(false);
    }
  };

  // ─── Empty cart state ─────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <CartIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h1 className="font-serif text-3xl text-foreground mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Discover unique products from around the world
          </p>
          <Link to="/products">
            <Button className="marketplace-gradient border-0 text-primary-foreground">
              Browse Products
            </Button>
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
        <Link
          to="/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
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
                {/* Product Image */}
                <Link
                  to={`/product/${item.product.id}`}
                  className="w-20 h-20 rounded-lg overflow-hidden shrink-0"
                >
                  <img
                    src={getImage(item.product)}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = "/placeholder.jpg"; }}
                  />
                </Link>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.product.id}`}
                    className="text-sm font-medium text-foreground hover:text-primary line-clamp-1"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {getSellerName(item.product)}
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    {formatPrice(item.product.price)}
                  </p>

                  {/* Line total */}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Subtotal: {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center border border-border rounded-md">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="px-2 py-1 text-xs hover:bg-secondary"
                    >
                      -
                    </button>
                    <span className="px-2 text-xs font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= (item.product.stock ?? 99)}
                      className="px-2 py-1 text-xs hover:bg-secondary disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Clear Cart */}
            <div className="flex justify-end">
              <button
                onClick={clearCart}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-xl bg-card border border-border p-6 sticky top-24 space-y-4">
              <h3 className="font-serif text-xl text-foreground">Order Summary</h3>

              {/* Item breakdown */}
              <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-muted-foreground">
                    <span className="truncate max-w-[60%]">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span>{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm border-t border-border pt-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-medium">Free</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold text-foreground">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full marketplace-gradient border-0 text-primary-foreground"
                size="lg"
              >
                {checkingOut
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
                  : "Proceed to Checkout"
                }
              </Button>

              <p className="text-[10px] text-center text-muted-foreground">
                Secure checkout · Buyer protection included
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Cart;