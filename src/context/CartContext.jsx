import { useState, useEffect, useCallback } from "react";
import { createContext, useContext } from "react";
import { currencies } from "../lib/mock-data.js";

const CartContext = createContext();

// Maps ISO country codes to currency codes
const COUNTRY_CURRENCY_MAP = {
  US: "USD", GB: "GBP",
  JP: "JPY", KR: "KRW",
  CA: "CAD", AU: "AUD",
  IN: "INR", KE: "KES",
  NG: "NGN", MA: "MAD",
  DK: "DKK", CN: "CNY",
  BR: "BRL", MX: "MXN",
  ZA: "ZAR", AE: "AED",
  SA: "SAR",
};

// All eurozone country codes map to EUR
const EUROZONE = new Set([
  "DE","FR","IT","ES","NL","BE","AT","PT",
  "FI","GR","IE","LU","SK","SI","EE","LV",
  "LT","CY","MT",
]);

export const CartProvider = ({ children }) => {
  const [items, setItems]       = useState([]);
  const [currency, setCurrency] = useState(currencies[0]); // default USD

  // ── Auto-detect currency from user's IP on mount ───────────
  useEffect(() => {
    const detectCurrency = async () => {
      try {
        const res  = await fetch("https://ipapi.co/json/");
        const data = await res.json();

        let countryCode = data.country_code; // e.g. "JP", "KE", "DE"

        // Remap eurozone countries to a shared "EU" key
        const currencyCode = EUROZONE.has(countryCode)
          ? "EUR"
          : COUNTRY_CURRENCY_MAP[countryCode];

        if (!currencyCode) return; // unknown country → stay on USD

        const matched = currencies.find((c) => c.code === currencyCode);
        if (matched) setCurrency(matched);
      } catch {
        // Silent fail — stays on USD default
      }
    };

    detectCurrency();
  }, []);

  // ── Add to cart ────────────────────────────────────────────
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

  // ── Remove specific item ───────────────────────────────────
  const removeFromCart = useCallback((productId) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  // ── Update quantity (removes if 0) ─────────────────────────
  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) return removeFromCart(productId);
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  // ── Clear entire cart ──────────────────────────────────────
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // ── Derived state ──────────────────────────────────────────
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // ── Format price in active currency ───────────────────────
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