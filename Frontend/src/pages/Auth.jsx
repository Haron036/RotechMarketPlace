import { useState, useEffect } from "react";
import { Mail, Lock, User, Globe, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast.js";

import { API_BASE } from "../lib/config";
const API_URL = `${API_BASE}/auth`;

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [userRole, setUserRole] = useState("BUYER"); // Matches backend expectation
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? "/login" : "/register";
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : { ...formData, role: userRole };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg || "Authentication failed");
      }

      const data = await response.json();

      // SAVE SESSION
      localStorage.setItem("jwt_token", data.token);
      localStorage.setItem("user_session", JSON.stringify({
        email: data.email,
        name: data.name,
        role: data.role, // This will be "SELLER" or "BUYER" from your Java Controller
      }));

      toast({ title: "Success!", description: "Redirecting..." });

      // NAVIGATION LOGIC
      // Use uppercase comparison to match your AuthController.java
      if (data.role === "SELLER") {
        navigate("/sell");
      } else {
        navigate("/");
      }

    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="rounded-2xl bg-card border p-6 space-y-4 shadow-sm">
            <h1 className="text-2xl font-serif text-center mb-6">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>

            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-medium">Full Name</label>
                <input name="fullName" type="text" required onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full p-2.5 rounded-lg bg-secondary text-sm outline-none" />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium">Email</label>
              <input name="email" type="email" required onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 rounded-lg bg-secondary text-sm outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Password</label>
              <input name="password" type="password" required onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full p-2.5 rounded-lg bg-secondary text-sm outline-none" />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-medium">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant={userRole === "BUYER" ? "default" : "outline"} onClick={() => setUserRole("BUYER")}>Buyer</Button>
                  <Button type="button" variant={userRole === "SELLER" ? "default" : "outline"} onClick={() => setUserRole("SELLER")}>Seller</Button>
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-4">
              {loading ? <Loader2 className="animate-spin" /> : (isLogin ? "Sign In" : "Register")}
            </Button>

            <p className="text-center text-sm text-primary cursor-pointer hover:underline" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Need an account? Sign up" : "Have an account? Sign in"}
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;