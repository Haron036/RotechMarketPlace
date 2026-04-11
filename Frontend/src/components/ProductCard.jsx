import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, Plus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";

const ProductCard = ({ product, index = 0 }) => {
  const { formatPrice, addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  // ── Safely resolve seller name ──────────────────────────────
  // Static data has seller.name, backend returns seller.email
  const sellerName =
    product.seller?.name ??
    product.seller?.email?.split("@")[0] ??
    "Unknown Seller";

  // ── Safely resolve first image ──────────────────────────────
  const BASE_URL = "http://localhost:8080";

  const imageUrl = product.images?.[0]
    ? product.images[0].startsWith("http")
      ? product.images[0] // external image (Pinterest etc.)
      : BASE_URL + product.images[0] // local image
    : "/placeholder.jpg";

  // ── Safely resolve rating ───────────────────────────────────
  const rating = product.rating ?? 0;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!localStorage.getItem("user_session")) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Sign in to add items to your cart.",
      });
      return navigate("/auth");
    }
    addToCart(product);
    toast({ title: "Added!", description: `${product.name} is in your cart.` });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <Link to={`/product/${product.id}`}>
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.src = "/placeholder.jpg";
            }} // fallback if URL breaks
          />
          <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              onClick={handleQuickAdd}
              className="w-full marketplace-gradient text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> Quick Add
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
            <span>{sellerName}</span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {rating.toFixed(1)}
            </span>
          </div>
          <h3 className="font-medium text-sm truncate">{product.name}</h3>
          <p className="font-bold mt-1">{formatPrice(product.price)}</p>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
