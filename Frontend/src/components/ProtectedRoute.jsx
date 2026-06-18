import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated, isSeller, hasStoredSession } from "../lib/auth";

// Loading component helper to keep views clean
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen w-screen bg-gray-50">
    <div className="flex flex-col items-center gap-2">
      <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-medium text-gray-500">Verifying secure session...</p>
    </div>
  </div>
);

// ── Protected Route Guard ──────────────────────────────────────
export const ProtectedRoute = ({ children }) => {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // If credentials exist, give React a microscopic window to sync state
    if (hasStoredSession()) {
      const timer = setTimeout(() => setIsInitializing(false), 200);
      return () => clearTimeout(timer);
    }
    setIsInitializing(false);
  }, []);

  if (isInitializing) {
    return <PageLoader />;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

// ── Seller Route Guard ─────────────────────────────────────────
export const SellerRoute = ({ children }) => {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (hasStoredSession()) {
      const timer = setTimeout(() => setIsInitializing(false), 200);
      return () => clearTimeout(timer);
    }
    setIsInitializing(false);
  }, []);

  if (isInitializing) {
    return <PageLoader />;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }

  if (!isSeller()) {
    console.warn("Access denied: Account does not possess Seller authority privileges.");
    return <Navigate to="/" replace />;
  }

  return children;
};