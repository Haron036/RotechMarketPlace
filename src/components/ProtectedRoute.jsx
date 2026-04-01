import { Navigate } from "react-router-dom";
import { isAuthenticated, isSeller } from "../lib/auth";

// Redirects to /auth if not logged in
export const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

// Redirects to / if not a seller
export const SellerRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }
  if (!isSeller()) {
    return <Navigate to="/" replace />;
  }
  return children;
};