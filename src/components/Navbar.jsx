import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Globe, User, LogOut, Menu, X } from "lucide-react";
import { useCart } from "../context/CartContext";
import { currencies } from "../lib/mock-data.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const Navbar = () => {
  const { totalItems, currency, setCurrency } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("user_session"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    setIsLoggedIn(false);
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg marketplace-gradient flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif text-xl hidden sm:block">Rotech Market</span>
        </Link>

        <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Search..." />
        </div>

        <nav className="flex items-center gap-4">
          <Select value={currency.code} onValueChange={(val) => setCurrency(currencies.find(c => c.code === val))}>
            <SelectTrigger className="w-20 h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}</SelectContent>
          </Select>

          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <Link to="/sell" className="text-sm font-medium hover:text-primary">Sell</Link>
              <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive"><LogOut className="w-4 h-4" /></button>
            </div>
          ) : (
            <Link to="/auth" className="text-sm font-medium flex items-center gap-1"><User className="w-4 h-4" /> Sign In</Link>
          )}

          <Link to="/cart" className="relative p-2">
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{totalItems}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;