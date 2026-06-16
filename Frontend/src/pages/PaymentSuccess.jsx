import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, Loader2, XCircle, ShoppingBag, ArrowRight, Clock } from "lucide-react";
import { Button } from "../components/ui/button";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE } from "../lib/config";

const REDIRECT_DELAY = 5;
const MAX_ATTEMPTS   = 6;
const POLL_INTERVAL  = 2000;

const PAYMENT_METHOD_LABELS = {
  INTASEND: "Card Payment",
  MPESA:    "M-Pesa",
};

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus]       = useState("checking");
  const [message, setMessage]     = useState("");
  const [orderInfo, setOrderInfo] = useState(null);
  const [countdown, setCountdown] = useState(REDIRECT_DELAY);
  const hasChecked                = useRef(false);
  const countdownRef              = useRef(null);

  // ── Poll order status (confirmed via IntaSend webhook on the backend) ────────
  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const orderId = searchParams.get("orderId");

    if (!orderId) {
      setStatus("failed");
      setMessage("Order reference not found. If you were charged, please contact support.");
      return;
    }

    let attempts = 0;

    const poll = async () => {
      try {
        const token = localStorage.getItem("jwt_token");
        const res = await fetch(`${API_BASE}/payments/order-status/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const text = await res.text();
        let data = {};
        try { data = JSON.parse(text); } catch { data = { message: text }; }

        if (!res.ok) {
          setStatus("failed");
          setMessage(data.message || "We could not look up your order. Please contact support.");
          return;
        }

        if (data.status === "CONFIRMED") {
          setStatus("success");
          setMessage("Your payment was completed and your order is confirmed.");
          setOrderInfo({
            orderId:       data.orderId,
            amount:        data.totalAmount,
            currency:      "USD",
            paymentMethod: data.paymentMethod,
          });
          return;
        }

        attempts += 1;
        if (attempts < MAX_ATTEMPTS) {
          setTimeout(poll, POLL_INTERVAL);
        } else {
          setStatus("processing");
          setMessage("Your payment is still being confirmed. We'll email you as soon as it's complete.");
          setOrderInfo({
            orderId:       data.orderId,
            amount:        data.totalAmount,
            currency:      "USD",
            paymentMethod: data.paymentMethod,
          });
        }
      } catch (err) {
        setStatus("failed");
        setMessage("A network error occurred while confirming your payment: " + err.message);
      }
    };

    poll();
  }, []);

  // ── Auto-redirect countdown ───────────────────────────────────────────────────
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

  const paymentMethodLabel = orderInfo?.paymentMethod
    ? (PAYMENT_METHOD_LABELS[orderInfo.paymentMethod] || orderInfo.paymentMethod)
    : "—";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-card border border-border rounded-2xl p-10 max-w-md w-full text-center">

          {/* Checking */}
          {status === "checking" && (
            <>
              <Loader2 className="w-14 h-14 mx-auto text-primary animate-spin mb-5" />
              <h1 className="font-serif text-2xl text-foreground mb-2">Confirming Your Payment</h1>
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your transaction...
              </p>
            </>
          )}

          {/* Success */}
          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-9 h-9 text-emerald-500" />
              </div>
              <h1 className="font-serif text-2xl text-foreground mb-1">Payment Successful!</h1>
              <p className="text-sm text-muted-foreground mb-6">{message}</p>

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
                    <span className="font-medium text-foreground">{paymentMethodLabel}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium text-emerald-600">Confirmed ✓</span>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground mb-5">
                A confirmation email has been sent to your registered email address.
              </p>

              <div className="flex gap-3 justify-center">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/my-orders")}>
                  <ShoppingBag className="w-4 h-4 mr-2" /> My Orders
                </Button>
                <Button
                  className="flex-1 marketplace-gradient border-0 text-primary-foreground"
                  onClick={() => navigate("/products")}
                >
                  Shop More <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-5">
                Redirecting in{" "}
                <span className="font-semibold text-foreground">{countdown}s</span>
                {" · "}
                <button
                  onClick={() => { clearInterval(countdownRef.current); setCountdown(0); }}
                  className="underline hover:text-foreground transition-colors"
                >
                  stay on page
                </button>
              </p>
            </>
          )}

          {/* Still processing (webhook hasn't arrived yet) */}
          {status === "processing" && (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5">
                <Clock className="w-9 h-9 text-amber-500" />
              </div>
              <h1 className="font-serif text-2xl text-foreground mb-1">Almost There</h1>
              <p className="text-sm text-muted-foreground mb-6">{message}</p>

              {orderInfo && (
                <div className="bg-secondary rounded-xl p-4 mb-6 text-left">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Order ID</span>
                    <span className="font-medium text-foreground">#{orderInfo.orderId}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-medium text-foreground">{paymentMethodLabel}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium text-amber-500">Pending</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/my-orders")}>
                  <ShoppingBag className="w-4 h-4 mr-2" /> My Orders
                </Button>
                <Button
                  className="flex-1 marketplace-gradient border-0 text-primary-foreground"
                  onClick={() => navigate("/products")}
                >
                  Continue Shopping <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}

          {/* Failed */}
          {status === "failed" && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
                <XCircle className="w-9 h-9 text-destructive" />
              </div>
              <h1 className="font-serif text-2xl text-foreground mb-1">Payment Not Confirmed</h1>
              <p className="text-sm text-muted-foreground mb-6">{message}</p>

              <div className="bg-secondary rounded-xl p-4 mb-6 text-left">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Need Help?
                </p>
                <p className="text-xs text-muted-foreground">
                  If you were charged but see this message, please email us at{" "}
                  <a href="mailto:globalmarketplace36@gmail.com" className="text-primary underline">
                    globalmarketplace36@gmail.com
                  </a>{" "}
                  with your order number.
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/cart")}>
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