import { useState } from "react";
import { Mail, Lock, User, Globe } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast.js";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userRole, setUserRole] = useState("buyer");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
  e.preventDefault();
  
  // 1. Get the full name from state (or email if login)
  const fullDisplayName = formData.fullName || formData.email.split('@')[0];

  // 2. Extract just the first word and capitalize it
  const firstName = fullDisplayName.trim().split(" ")[0];
  const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  const sessionData = { 
    email: formData.email, 
    role: userRole,
    name: capitalizedFirstName // Now saves "Aron" instead of "Aron Smith"
  };

  localStorage.setItem("user_session", JSON.stringify(sessionData));

  toast({ title: `Success, ${capitalizedFirstName}!` });

  const destination = userRole === "seller" ? "/sell" : "/cart";

  setTimeout(() => {
    window.location.href = destination;
  }, 1500);
};
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl marketplace-gradient flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-serif text-3xl text-foreground">
              {isLogin ? "Welcome Back" : "Join RotechMarketplace"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isLogin
                ? "Sign in to your account"
                : "Create your account to start buying & selling"}
            </p>
          </div>

          <form 
            onSubmit={handleSubmit}
            className="rounded-2xl bg-card border border-border p-6 space-y-4 shadow-sm"
          >
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Role Selection - Visible only during Sign Up */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">I want to</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUserRole("buyer")}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      userRole === "buyer" ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <span className="text-sm font-medium text-foreground">Buy</span>
                    <p className="text-[10px] text-muted-foreground">Shop products</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRole("seller")}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      userRole === "seller" ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <span className="text-sm font-medium text-foreground">Sell</span>
                    <p className="text-[10px] text-muted-foreground">List products</p>
                  </button>
                </div>
              </div>
            )}

            {/* Login Role Simulation (Optional toggle for testing login redirect) */}
            {isLogin && (
              <div className="flex items-center justify-end">
                <button 
                  type="button"
                  onClick={() => setUserRole(userRole === "buyer" ? "seller" : "buyer")}
                  className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                >
                  Logging in as: <span className="capitalize font-bold">{userRole}</span> (Click to toggle)
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full marketplace-gradient border-0 text-primary-foreground mt-2"
              size="lg"
            >
              {isLogin ? "Sign In" : "Create Account"}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:underline cursor-pointer bg-transparent border-none"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;