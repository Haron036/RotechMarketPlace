package RotechMarketplace.globalmarketplace.Controllers;

import RotechMarketplace.globalmarketplace.DTOs.OrderRequest;
import RotechMarketplace.globalmarketplace.DTOs.PaymentRequest;
import RotechMarketplace.globalmarketplace.Entities.CustomerOrder;
import RotechMarketplace.globalmarketplace.Entities.OrderItem;
import RotechMarketplace.globalmarketplace.Entities.Product;
import RotechMarketplace.globalmarketplace.Entities.User;
import RotechMarketplace.globalmarketplace.Repositories.OrderRepository;
import RotechMarketplace.globalmarketplace.Repositories.ProductRepository;
import RotechMarketplace.globalmarketplace.Repositories.UserRepository;
import RotechMarketplace.globalmarketplace.Services.EmailService;
import RotechMarketplace.globalmarketplace.Services.MpesaService;
import RotechMarketplace.globalmarketplace.Services.PayPalService;
import RotechMarketplace.globalmarketplace.Services.StripeService;
import com.stripe.model.PaymentIntent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final StripeService stripeService;
    private final MpesaService mpesaService;
    private final PayPalService payPalService;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${stripe.publishable.key}")
    private String stripePublishableKey;

    public PaymentController(StripeService stripeService,
                             MpesaService mpesaService,
                             PayPalService payPalService,
                             OrderRepository orderRepository,
                             ProductRepository productRepository,
                             UserRepository userRepository,
                             EmailService emailService) {
        this.stripeService     = stripeService;
        this.mpesaService      = mpesaService;
        this.payPalService     = payPalService;
        this.orderRepository   = orderRepository;
        this.productRepository = productRepository;
        this.userRepository    = userRepository;
        this.emailService      = emailService;
    }

    // ─── CHECKOUT ENTRY POINT ────────────────────────────────────────────────────

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody PaymentRequest request,
                                      Authentication auth) {
        try {
            User buyer = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            CustomerOrder order = buildOrder(buyer, request.getItems(), request.getAmount());
            CustomerOrder savedOrder = orderRepository.save(order);

            return switch (request.getPaymentMethod().toUpperCase()) {
                case "STRIPE" -> handleStripe(request, savedOrder);
                case "MPESA"  -> handleMpesa(request, savedOrder);
                case "PAYPAL" -> handlePayPal(request, savedOrder);
                default       -> ResponseEntity.badRequest().body("Unsupported payment method");
            };

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // ─── STRIPE ──────────────────────────────────────────────────────────────────

    private ResponseEntity<?> handleStripe(PaymentRequest request,
                                           CustomerOrder order) throws Exception {
        PaymentIntent intent = stripeService.createPaymentIntent(
                request.getAmount(),
                request.getCurrency() != null ? request.getCurrency() : "usd"
        );

        return ResponseEntity.ok(Map.of(
                "status",         "pending",
                "paymentMethod",  "STRIPE",
                "clientSecret",   intent.getClientSecret(),
                "publishableKey", stripePublishableKey,
                "orderId",        order.getId()
        ));
    }

    // ─── MPESA ───────────────────────────────────────────────────────────────────

    private ResponseEntity<?> handleMpesa(PaymentRequest request,
                                          CustomerOrder order) {
        Map<String, Object> result = mpesaService.stkPush(
                request.getPhoneNumber(),
                request.getAmount()
        );

        String responseCode = (String) result.get("ResponseCode");
        if ("0".equals(responseCode)) {
            return ResponseEntity.ok(Map.of(
                    "status",            "pending",
                    "paymentMethod",     "MPESA",
                    "message",           "STK Push sent. Please check your phone.",
                    "checkoutRequestId", result.get("CheckoutRequestID"),
                    "orderId",           order.getId()
            ));
        }
        return ResponseEntity.badRequest()
                .body("M-Pesa request failed: " + result.get("ResponseDescription"));
    }

    @PostMapping("/mpesa/callback")
    public ResponseEntity<?> mpesaCallback(@RequestBody Map<String, Object> payload) {
        System.out.println("M-Pesa Callback: " + payload);
        return ResponseEntity.ok().build();
    }

    // ─── PAYPAL ──────────────────────────────────────────────────────────────────

    private ResponseEntity<?> handlePayPal(PaymentRequest request,
                                           CustomerOrder order) {
        try {
            String currency = request.getCurrency() != null ? request.getCurrency() : "USD";

            Map<String, String> paypalData = payPalService.createOrder(
                    request.getAmount(),
                    currency,
                    order.getId()
            );

            return ResponseEntity.ok(Map.of(
                    "status",        "redirect",
                    "paymentMethod", "PAYPAL",
                    "approvalUrl",   paypalData.get("approvalUrl"),
                    "paypalOrderId", paypalData.get("paypalOrderId"),
                    "orderId",       order.getId()
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("PayPal error: " + e.getMessage());
        }
    }

    // Called by frontend after user approves payment on PayPal and is redirected back
    @PostMapping("/paypal/capture")
    public ResponseEntity<?> capturePayPalPayment(@RequestParam String paypalOrderId) {
        try {
            Map<?, ?> result = payPalService.captureOrder(paypalOrderId);
            String status = (String) result.get("status");

            if ("COMPLETED".equals(status)) {
                List<Map<?, ?>> purchaseUnits = (List<Map<?, ?>>) result.get("purchase_units");
                if (purchaseUnits != null && !purchaseUnits.isEmpty()) {
                    String customId = (String) purchaseUnits.get(0).get("custom_id");
                    if (customId != null) {
                        Long orderId = Long.parseLong(customId);
                        orderRepository.findById(orderId).ifPresent(order -> {
                            order.setStatus(CustomerOrder.OrderStatus.CONFIRMED); // ← CONFIRMED after payment
                            orderRepository.save(order);

                            // ── Send confirmation email to buyer ──────────────
                            String buyerEmail = order.getBuyer().getEmail();
                            String buyerName  = order.getBuyer().getName() != null
                                    ? order.getBuyer().getName() : "Customer";
                            emailService.sendOrderConfirmedEmail(
                                    buyerEmail, buyerName,
                                    order.getId(), order.getTotalAmount()
                            );
                        });
                    }
                }

                return ResponseEntity.ok(Map.of(
                        "status",  "success",
                        "message", "Payment captured successfully"
                ));
            }

            return ResponseEntity.badRequest()
                    .body("Capture incomplete. PayPal status: " + status);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("PayPal capture error: " + e.getMessage());
        }
    }

    // PayPal redirects here if the user cancels on PayPal's page
    @GetMapping("/paypal/cancel")
    public ResponseEntity<?> paypalCancel(@RequestParam Long orderId) {
        return ResponseEntity.ok(Map.of(
                "status",  "cancelled",
                "message", "PayPal payment was cancelled.",
                "orderId", orderId
        ));
    }

    // ─── SHARED ORDER BUILDER ─────────────────────────────────────────────────────

    private CustomerOrder buildOrder(User buyer,
                                     List<OrderRequest.OrderItemRequest> items,
                                     Double totalAmount) {
        CustomerOrder order = new CustomerOrder();
        order.setBuyer(buyer);
        order.setTotalAmount(totalAmount);

        List<OrderItem> orderItems = new ArrayList<>();
        for (OrderRequest.OrderItemRequest itemReq : items) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + itemReq.getProductId()));

            product.setStock(product.getStock() - itemReq.getQuantity());
            productRepository.save(product);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setPrice(itemReq.getPrice());
            orderItems.add(orderItem);
        }

        order.setItems(orderItems);
        return order;
    }
}