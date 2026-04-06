import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const SERVER_URL = "http://localhost:8080";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("capturing");
  const [message, setMessage] = useState("");
  const hasCaptured = useRef(false); // ← prevents double capture calls

  useEffect(() => {
    if (hasCaptured.current) return; // ← stop if already ran
    hasCaptured.current = true;

    const paypalOrderId = searchParams.get("token");

    if (!paypalOrderId) {
      setStatus("failed");
      setMessage("Missing payment token. Please contact support.");
      return;
    }

    const capture = async () => {
      try {
        const response = await fetch(
          `${SERVER_URL}/api/payments/paypal/capture?paypalOrderId=${paypalOrderId}`,
          { method: "POST" }
        );

        // ← Handle non-JSON error responses safely
        const text = await response.text();
        let data = {};
        try { data = JSON.parse(text); } catch { data = { message: text }; }

        if (response.ok && data.status === "success") {
          setStatus("success");
          setMessage("Your payment was completed successfully!");
          localStorage.removeItem("paypal_order_id");
        } else {
          setStatus("failed");
          setMessage(data.message || "Payment capture failed. Please contact support.");
        }
      } catch (err) {
        setStatus("failed");
        setMessage("Something went wrong capturing your payment: " + err.message);
      }
    };

    capture();
  }, []); // ← empty deps, runs once only

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-card border border-border rounded-2xl p-10 max-w-md w-full text-center shadow-xl">

          {status === "capturing" && (
            <>
              <Loader2 className="w-14 h-14 mx-auto text-primary animate-spin mb-4" />
              <h1 className="font-serif text-2xl text-foreground mb-2">Confirming Payment</h1>
              <p className="text-sm text-muted-foreground">
                Please wait while we confirm your PayPal payment...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="w-14 h-14 mx-auto text-emerald-500 mb-4" />
              <h1 className="font-serif text-2xl text-foreground mb-2">Payment Successful!</h1>
              <p className="text-sm text-muted-foreground mb-6">{message}</p>
              <Button
                onClick={() => navigate("/products")}
                className="marketplace-gradient border-0 text-primary-foreground"
              >
                Continue Shopping
              </Button>
            </>
          )}

          {status === "failed" && (
            <>
              <XCircle className="w-14 h-14 mx-auto text-destructive mb-4" />
              <h1 className="font-serif text-2xl text-foreground mb-2">Payment Failed</h1>
              <p className="text-sm text-muted-foreground mb-6">{message}</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate("/cart")}>
                  Back to Cart
                </Button>
                <Button
                  onClick={() => navigate("/products")}
                  className="marketplace-gradient border-0 text-primary-foreground"
                >
                  Browse Products
                </Button>
              </div>
            </>
          )}

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;