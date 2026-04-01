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

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!localStorage.getItem("user_session")) {
      toast({ variant: "destructive", title: "Login Required", description: "Sign in to add items to your cart." });
      return navigate("/auth");
    }
    addToCart(product);
    toast({ title: "Added!", description: `${product.name} is in your cart.` });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} className="group">
      <Link to={`/product/${product.id}`}>
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary">
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button onClick={handleQuickAdd} className="w-full marketplace-gradient text-white">
              <Plus className="w-4 h-4 mr-2" /> Quick Add
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
            <span>{product.seller.name}</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {product.rating}</span>
          </div>
          <h3 className="font-medium text-sm truncate">{product.name}</h3>
          <p className="font-bold mt-1">{formatPrice(product.price)}</p>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;