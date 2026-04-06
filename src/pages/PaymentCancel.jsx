import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-card border border-border rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
          <XCircle className="w-14 h-14 mx-auto text-amber-500 mb-4" />
          <h1 className="font-serif text-2xl text-foreground mb-2">Payment Cancelled</h1>
          <p className="text-sm text-muted-foreground mb-6">
            You cancelled the PayPal payment. Your cart is still saved.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/cart")}>Back to Cart</Button>
            <Button onClick={() => navigate("/products")} className="marketplace-gradient border-0 text-primary-foreground">
              Browse Products
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentCancel;