import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart, Search, Globe, User,
  LogOut, ShoppingBag, Store,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { currencies } from "../lib/mock-data.js";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "./ui/select";

const Navbar = () => {
  const { totalItems, currency, setCurrency } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSeller, setIsSeller]     = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const session = localStorage.getItem("user_session");
    if (session) {
      setIsLoggedIn(true);
      try {
        const parsed = JSON.parse(session);
        setIsSeller(parsed?.role === "SELLER");
      } catch {
        setIsSeller(false);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    localStorage.removeItem("jwt_token");
    setIsLoggedIn(false);
    setIsSeller(false);
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg marketplace-gradient flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif text-xl hidden sm:block">Global Marketplace</span>
        </Link>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="Search..."
          />
        </div>

        <nav className="flex items-center gap-4">

          {/* Currency Selector */}
          <Select
            value={currency.code}
            onValueChange={(val) =>
              setCurrency(currencies.find((c) => c.code === val))
            }
          >
            <SelectTrigger className="w-20 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isLoggedIn ? (
            <>
              {/* SELLER only — Dashboard link */}
              {isSeller && (
                <Link
                  to="/sell"
                  className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors"
                >
                  <Store className="w-4 h-4" />
                  <span className="hidden sm:block">Dashboard</span>
                </Link>
              )}

              {/* BUYER only — My Orders link */}
              {!isSeller && (
                <Link
                  to="/my-orders"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden sm:block">My Orders</span>
                </Link>
              )}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="text-sm font-medium flex items-center gap-1 hover:text-primary transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:block">Sign In</span>
            </Link>
          )}

          {/* Cart — visible to everyone */}
          <Link to="/cart" className="relative p-2">
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

        </nav>
      </div>
    </header>
  );
};

export default Navbar;