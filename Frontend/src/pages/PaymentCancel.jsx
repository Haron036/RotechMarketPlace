import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle, ShoppingCart, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PaymentCancel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Works for both PayPal (?orderId=) and Flutterwave (?tx_ref=rotech-{orderId}-...)
  const orderId = searchParams.get("orderId") || (() => {
    const txRef = searchParams.get("tx_ref");
    return txRef ? txRef.split("-")[1] : null;
  })();

  // Detect which gateway they came from
  const fromFlutterwave = !!searchParams.get("tx_ref");
  const gatewayLabel    = fromFlutterwave ? "Flutterwave" : "PayPal";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-card border border-border rounded-2xl p-10 max-w-md w-full text-center shadow-xl">

          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5">
            <XCircle className="w-9 h-9 text-amber-500" />
          </div>

          <h1 className="font-serif text-2xl text-foreground mb-2">Payment Cancelled</h1>
          <p className="text-sm text-muted-foreground mb-6">
            You cancelled the {gatewayLabel} payment. No charge was made.
            Your cart is still saved — you can complete your purchase anytime.
          </p>

          {/* Order reference if available */}
          {orderId && (
            <div className="bg-secondary rounded-xl p-4 mb-6 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order Reference</span>
                <span className="font-medium text-foreground">#{orderId}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-amber-500">Cancelled</span>
              </div>
            </div>
          )}

          {/* Help note */}
          <p className="text-xs text-muted-foreground mb-6">
            If you experienced an issue during checkout, please contact us at{" "}
            <a href="mailto:globalmarketplace36@gmail.com" className="text-primary underline">
              globalmarketplace36@gmail.com
            </a>
          </p>

          {/* Buttons */}
          <div className="flex gap-3 justify-center">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/cart")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cart
            </Button>
            <Button
              className="flex-1 marketplace-gradient border-0 text-primary-foreground"
              onClick={() => navigate("/products")}
            >
              <ShoppingCart className="w-4 h-4 mr-2" /> Browse Products
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentCancel;