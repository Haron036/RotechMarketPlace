import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, ShoppingCart, Truck, Shield, ArrowLeft, Minus, Plus, CheckCircle, Info, MessageSquare, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext.jsx";
import { Button } from "../components/ui/button.jsx";
import { useToast } from "../components/ui/use-toast.js";

// The base URL of your Spring Boot server
const SERVER_URL = "http://localhost:8080";
const API_BASE = `${SERVER_URL}/api`;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart, formatPrice } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // ─── Fetch product from backend ───────────────────────────
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const response = await fetch(`${API_BASE}/products/${id}`);
        if (response.status === 404) {
          setNotFound(true);
          return;
        }
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, API_BASE]);

  // ─── Helper to resolve image paths ────────────────────────
  const getImageUrl = (path) => {
    if (!path) return "/placeholder.jpg";
    if (path.startsWith("http")) return path;
    return `${SERVER_URL}${path}`;
  };

  // ─── Safely resolve fields from backend shape ─────────────
  const sellerName = product?.seller?.name 
    ?? product?.seller?.email?.split("@")[0] 
    ?? "Unknown Seller";
    
  const sellerAvatar = product?.seller?.avatar
    ? getImageUrl(product.seller.avatar)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerName)}&background=random`;

  const sellerLocation = product?.seller?.location ?? "Global";
  const sellerRating = product?.seller?.rating ?? "5.0";
  const sellerSales = product?.seller?.totalSales ?? 0;
  const images = product?.images?.length > 0 ? product.images : ["/placeholder.jpg"];
  const rating = product?.rating ?? 0;
  const reviewCount = product?.reviewCount ?? 0;
  const stock = product?.stock ?? 0;

  const handleAddToCart = () => {
    const userSession = localStorage.getItem("user_session");
    if (!userSession) {
      toast({
        variant: "destructive",
        title: "Sign in required",
        description: "You must be logged in as a buyer to add items to your cart.",
      });
      navigate("/auth");
      return;
    }
    addToCart(product, quantity);
    toast({
      title: "Successfully Added",
      description: `${quantity}x ${product.name} is now in your cart.`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm">Loading product...</p>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="font-serif text-3xl text-foreground mb-4">Product Not Found</h1>
        <Link to="/products">
          <Button variant="outline">Return to Marketplace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Products
        </Link>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* LEFT: Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-secondary border border-border group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={getImageUrl(images[selectedImage])}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => { e.target.src = "/placeholder.jpg"; }}
                />
              </AnimatePresence>

              {stock > 0 && stock < 10 && (
                <div className="absolute top-6 left-6 px-4 py-2 bg-destructive text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-xl">
                  Only {stock} Left
                </div>
              )}
              {stock === 0 && (
                <div className="absolute top-6 left-6 px-4 py-2 bg-destructive text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-xl">
                  Out of Stock
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImage === i ? "border-primary ring-4 ring-primary/10" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = "/placeholder.jpg"; }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Purchase Sidebar */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="mb-6">
              <p className="text-primary font-bold text-xs uppercase tracking-widest mb-2">
                {product.category}
              </p>
              <h1 className="font-serif text-4xl text-foreground mb-4 leading-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-border"}`} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground font-medium">
                  {rating.toFixed(1)} / 5.0 ({reviewCount} Verified Buyers)
                </span>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-4xl font-serif text-foreground mb-2">{formatPrice(product.price)}</p>
              <p className="text-sm text-muted-foreground italic">Tax included. Shipping calculated at checkout.</p>
            </div>

            {/* Seller Badge */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border mb-8 transition-all hover:shadow-md">
              <div className="relative">
                <img
                  src={sellerAvatar}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerName)}`;
                  }}
                />
                <div className="absolute -bottom-1 -right-1 bg-primary text-white p-0.5 rounded-full ring-2 ring-card">
                  <CheckCircle className="w-3 h-3" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="text-sm font-bold text-foreground">{sellerName}</p>
                  <span className="text-xs font-bold text-primary">{sellerRating} ★</span>
                </div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-tighter">
                  Pro Seller • {sellerLocation} • {sellerSales.toLocaleString()} Sales
                </p>
              </div>
            </div>

            {/* Quantity + Add to Cart */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-secondary rounded-xl border border-border h-14 px-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-background rounded-lg transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                    disabled={stock === 0}
                    className="w-10 h-10 flex items-center justify-center hover:bg-background rounded-lg transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <Button
                  onClick={handleAddToCart}
                  disabled={stock === 0}
                  size="lg"
                  className="flex-1 h-14 marketplace-gradient border-0 text-white font-bold text-lg shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  <ShoppingCart className="w-5 h-5 mr-3" />
                  {stock === 0 ? "Out of Stock" : "Add to Cart"}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                  <Truck className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Shipping</p>
                    <p className="text-xs font-semibold">Free Worldwide</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Assurance</p>
                    <p className="text-xs font-semibold">Buyer Protection</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-secondary text-muted-foreground border border-border"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM: Tabs */}
        <section className="mt-20 border-t border-border pt-12">
          <div className="flex gap-8 border-b border-border mb-8 overflow-x-auto">
            {["description", "reviews", "shipping"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "description" && (
              <motion.div
                key="desc"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl prose prose-neutral prose-sm lg:prose-base text-muted-foreground leading-relaxed"
              >
                <h3 className="font-serif text-2xl text-foreground mb-4">Detailed Specifications</h3>
                <p className="mb-6">{product.description}</p>
                <div className="grid md:grid-cols-2 gap-8 mt-8">
                  <div className="bg-card p-6 rounded-2xl border border-border">
                    <h4 className="text-foreground font-bold mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4" /> Material & Build
                    </h4>
                    <p>Crafted using premium-grade materials sourced globally. Each unit undergoes a rigorous 12-point quality check to ensure maximum durability and performance.</p>
                  </div>
                  <div className="bg-card p-6 rounded-2xl border border-border">
                    <h4 className="text-foreground font-bold mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Ethics & Sustainability
                    </h4>
                    <p>Rotech Marketplace verifies all sellers. This product is produced under fair-trade conditions and shipped using carbon-neutral logistics where available.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "reviews" && (
              <motion.div
                key="rev"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="max-w-3xl space-y-6"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-serif text-2xl text-foreground">Verified Reviews</h3>
                  <Button variant="outline" className="gap-2">
                    <MessageSquare className="w-4 h-4" /> Write a Review
                  </Button>
                </div>
                {reviewCount === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm italic">
                    No reviews yet. Be the first to review this product!
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-sm italic">
                    {reviewCount} verified reviews — review system coming soon.
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "shipping" && (
              <motion.div
                key="ship"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="max-w-3xl"
              >
                <h3 className="font-serif text-2xl text-foreground mb-6">Shipping & Returns</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card p-6 rounded-2xl border border-border">
                    <Truck className="w-6 h-6 text-primary mb-3" />
                    <h4 className="font-bold text-foreground mb-2">Free Worldwide Shipping</h4>
                    <p className="text-sm text-muted-foreground">
                      All orders ship free regardless of location. Standard delivery takes 7–14 business days. Express options available at checkout.
                    </p>
                  </div>
                  <div className="bg-card p-6 rounded-2xl border border-border">
                    <Shield className="w-6 h-6 text-primary mb-3" />
                    <h4 className="font-bold text-foreground mb-2">30-Day Returns</h4>
                    <p className="text-sm text-muted-foreground">
                      Not satisfied? Return within 30 days for a full refund. Items must be in original condition. Return shipping is on us.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default ProductDetail;