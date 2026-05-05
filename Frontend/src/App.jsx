import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ToastProvider } from "./components/ui/toast";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { CartProvider } from "./context/CartContext";
import { ProtectedRoute, SellerRoute } from "./components/ProtectedRoute";

import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Auth from "./pages/Auth";
import SellerDashboard from "./pages/SellerDashboard";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess"; // ← NEW
import PaymentCancel from "./pages/PaymentCancel"; // ← NEW
import MyOrders from "./pages/MyOrders";

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

                {/* PayPal Return Routes - must be public */}
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/cancel" element={<PaymentCancel />} />


                {/* Protected - any logged in user */}
                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute>
                      <Cart />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-orders"
                  element={
                    <ProtectedRoute>
                      <MyOrders />
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
