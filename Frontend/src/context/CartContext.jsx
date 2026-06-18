import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { currencies } from "../lib/mock-data.js";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // ── Persistent Cart Items State ─────────────────────────────
  const [items, setItems] = useState(() => {
    try {
      const savedItems = localStorage.getItem("rotech_cart_items");
      return savedItems ? JSON.parse(savedItems) : [];
    } catch (error) {
      console.error("Failed to parse persisted cart items:", error);
      return [];
    }
  });

  // Default to the first currency object from configuration (typically USD)
  const [currency, setCurrency] = useState(currencies[0]);

  // Sync cart items change to localStorage
  useEffect(() => {
    localStorage.setItem("rotech_cart_items", JSON.stringify(items));
  }, [items]);

  // ── Auto-detect currency safely on mount ───────────────────
  useEffect(() => {
    const detectCurrency = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        
        // Safe Guard: Fail fast on rate-limiting (429) or engine drops (500)
        if (!res.ok) {
          console.warn(`Currency detection skipped. API responded with status: ${res.status}`);
          return; 
        }

        const data = await res.json();
        
        // ipapi.co provides a direct 'currency' field (e.g., "KES", "USD", "EUR")
        const detectedCurrencyCode = data.currency; 
        if (!detectedCurrencyCode) return;

        const matched = currencies.find((c) => c.code === detectedCurrencyCode);
        if (matched) {
          setCurrency(matched);
        }
      } catch (error) {
        // Suppress and handle structural errors or parsing exceptions gracefully
        console.error("Silent fallback handling geo-ip currency context lookup:", error);
      }
    };

    detectCurrency();
  }, []);

  // ── Cart Actions ───────────────────────────────────────────
  const addToCart = useCallback((product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) return removeFromCart(productId);
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // ── Derived State ──────────────────────────────────────────
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // ── Price Transformation Utility ───────────────────────────
  const formatPrice = useCallback(
    (price) => {
      const converted = price * currency.rate;
      return `${currency.symbol}${converted.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [currency]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        currency,
        setCurrency,
        formatPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};