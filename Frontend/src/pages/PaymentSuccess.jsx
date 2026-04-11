import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, Loader2, XCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const SERVER_URL = "http://localhost:8080";
const REDIRECT_DELAY = 5; // seconds before auto-redirect on success

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus]       = useState("capturing"); // "capturing" | "success" | "failed"
  const [message, setMessage]     = useState("");
  const [orderInfo, setOrderInfo] = useState(null);        // holds order details on success
  const [countdown, setCountdown] = useState(REDIRECT_DELAY);
  const hasCaptured               = useRef(false);         // prevents double capture on React StrictMode
  const countdownRef              = useRef(null);

  // ── Capture Payment ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (hasCaptured.current) return;
    hasCaptured.current = true;

    // PayPal appends ?token=PAYPAL_ORDER_ID to your return_url
    // It may also come as ?paypalOrderId= depending on your backend redirect
    const paypalOrderId =
      searchParams.get("token") ||
      searchParams.get("paypalOrderId") ||
      localStorage.getItem("paypal_order_id");

    if (!paypalOrderId) {
      setStatus("failed");
      setMessage("Payment token not found. If you were charged, please contact support.");
      return;
    }

    const capture = async () => {
      try {
        const response = await fetch(
          `${SERVER_URL}/api/payments/paypal/capture?paypalOrderId=${paypalOrderId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );

        // Safely parse response — backend may return plain text on errors
        const text = await response.text();
        let data = {};
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }

        if (response.ok && data.status === "success") {
          setStatus("success");
          setMessage("Your PayPal payment was completed and your order is confirmed.");
          setOrderInfo({
            orderId:   data.orderId   || searchParams.get("orderId") || "—",
            amount:    data.amount    || null,
            currency:  data.currency  || "USD",
            buyerName: data.buyerName || null,
          });
          localStorage.removeItem("paypal_order_id");
        } else {
          setStatus("failed");
          setMessage(
            data.message ||
            "We could not confirm your payment. Please contact support if you were charged."
          );
        }
      } catch (err) {
        setStatus("failed");
        setMessage("A network error occurred while confirming your payment: " + err.message);
      }
    };

    capture();
  }, []); // runs once only

  // ── Auto-redirect countdown after success ────────────────────────────────────
  useEffect(() => {
    if (status !== "success") return;

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          navigate("/products");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownRef.current);
  }, [status, navigate]);

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-card border border-border rounded-2xl p-10 max-w-md w-full text-center">

          {/* ── Capturing state ── */}
          {status === "capturing" && (
            <>
              <Loader2 className="w-14 h-14 mx-auto text-primary animate-spin mb-5" />
              <h1 className="font-serif text-2xl text-foreground mb-2">
                Confirming Your Payment
              </h1>
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your PayPal transaction...
              </p>
            </>
          )}

          {/* ── Success state ── */}
          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-9 h-9 text-emerald-500" />
              </div>

              <h1 className="font-serif text-2xl text-foreground mb-1">
                Payment Successful!
              </h1>
              <p className="text-sm text-muted-foreground mb-6">{message}</p>

              {/* Order summary card */}
              {orderInfo && (
                <div className="bg-secondary rounded-xl p-4 mb-6 text-left space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Order Summary
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Order ID</span>
                    <span className="font-medium text-foreground">#{orderInfo.orderId}</span>
                  </div>
                  {orderInfo.amount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount Paid</span>
                      <span className="font-medium text-emerald-600">
                        {orderInfo.currency} {parseFloat(orderInfo.amount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-medium text-foreground">PayPal</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium text-emerald-600">Confirmed ✓</span>
                  </div>
                </div>
              )}

              {/* Confirmation note */}
              <p className="text-xs text-muted-foreground mb-5">
                A confirmation email has been sent to your registered email address.
              </p>

              {/* Buttons */}
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/orders")}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  My Orders
                </Button>
                <Button
                  className="flex-1 marketplace-gradient border-0 text-primary-foreground"
                  onClick={() => navigate("/products")}
                >
                  Shop More
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Auto-redirect countdown */}
              <p className="text-xs text-muted-foreground mt-5">
                Redirecting to products in{" "}
                <span className="font-semibold text-foreground">{countdown}s</span>
                {" "}·{" "}
                <button
                  onClick={() => {
                    clearInterval(countdownRef.current);
                    setCountdown(0);
                  }}
                  className="underline hover:text-foreground transition-colors"
                >
                  stay on page
                </button>
              </p>
            </>
          )}

          {/* ── Failed state ── */}
          {status === "failed" && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
                <XCircle className="w-9 h-9 text-destructive" />
              </div>

              <h1 className="font-serif text-2xl text-foreground mb-1">
                Payment Not Confirmed
              </h1>
              <p className="text-sm text-muted-foreground mb-6">{message}</p>

              {/* Support info */}
              <div className="bg-secondary rounded-xl p-4 mb-6 text-left">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Need Help?
                </p>
                <p className="text-xs text-muted-foreground">
                  If you were charged but see this message, please email us at{" "}
                  <a
                    href="mailto:globalmarketplace36@gmail.com"
                    className="text-primary underline"
                  >
                    globalmarketplace36@gmail.com
                  </a>{" "}
                  with your PayPal transaction ID.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/cart")}
                >
                  Back to Cart
                </Button>
                <Button
                  className="flex-1 marketplace-gradient border-0 text-primary-foreground"
                  onClick={() => navigate("/products")}
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




