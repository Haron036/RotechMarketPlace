import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

// UI Providers and Components
import { ToastProvider } from "./components/ui/toast";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { CartProvider } from "./context/CartContext";

// Protected Route Guards
import { ProtectedRoute, SellerRoute } from "./components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Auth from "./pages/Auth";
import SellerDashboard from "./pages/SellerDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastProvider>
          <CartProvider>
            <Toaster />

            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/auth" element={<Auth />} />

                {/* Protected - any logged in user */}
                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute>
                      <Cart />
                    </ProtectedRoute>
                  }
                />

                {/* Protected - sellers only */}
                <Route
                  path="/sell"
                  element={
                    <SellerRoute>
                      <SellerDashboard />
                    </SellerRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;