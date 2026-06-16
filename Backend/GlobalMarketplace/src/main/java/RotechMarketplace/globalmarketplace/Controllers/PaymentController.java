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
import RotechMarketplace.globalmarketplace.Services.UnifiedCheckoutService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final UnifiedCheckoutService unifiedCheckoutService;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public PaymentController(UnifiedCheckoutService unifiedCheckoutService,
                             OrderRepository orderRepository,
                             ProductRepository productRepository,
                             UserRepository userRepository,
                             EmailService emailService) {
        this.unifiedCheckoutService = unifiedCheckoutService;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    // ─── CHECKOUT ENTRY POINT ─────────────────────────────────────────────────
    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody PaymentRequest request,
                                      Authentication auth) {
        try {
            User buyer = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Convert raw request pricing values over to safe BigDecimal representations
            //  RIGHT: Just assign it directly since it's already a BigDecimal
            BigDecimal baseUsdAmount = request.getAmount();

            // Default tax parameter to 0 if not explicitly provided
            BigDecimal taxRate = request.getTaxRate() != null ? BigDecimal.valueOf(request.getTaxRate()) : BigDecimal.ZERO;

            // Persist order state inside the core marketplace records
            CustomerOrder order = buildOrder(buyer, request.getItems(), baseUsdAmount);
            CustomerOrder savedOrder = orderRepository.save(order);

            String[] name = splitName(buyer.getName());
            String currency = request.getCurrency() != null ? request.getCurrency() : "USD";
            String country = request.getCountry() != null ? request.getCountry() : "KE";
            String paymentMethod = request.getPaymentMethod().toUpperCase();

            // Delegate calculation and orchestration parameters to the unified engine
            Map<String, Object> gatewayResult = unifiedCheckoutService.processCheckout(
                    baseUsdAmount,
                    taxRate,
                    savedOrder.getId(),
                    buyer.getEmail(),
                    name[0],
                    name[1],
                    country,
                    request.getPhoneNumber(),
                    paymentMethod
            );

            // Update order record tracking values
            if ("MPESA".equalsIgnoreCase(paymentMethod)) {
                String responseCode = String.valueOf(gatewayResult.get("ResponseCode"));
                if ("0".equals(responseCode)) {
                    savedOrder.setPaymentMethod("MPESA");
                    savedOrder.setPaymentReference(String.valueOf(gatewayResult.get("CheckoutRequestID")));
                    orderRepository.save(savedOrder);

                    return ResponseEntity.ok(Map.of(
                            "status", "pending",
                            "paymentMethod", "MPESA",
                            "message", "STK Push sent. Please check your phone.",
                            "checkoutRequestId", gatewayResult.get("CheckoutRequestID"),
                            "orderId", savedOrder.getId()
                    ));
                } else {
                    return ResponseEntity.badRequest()
                            .body("M-Pesa execution failed: " + gatewayResult.get("ResponseDescription"));
                }
            } else {
                // Handle fallback hosted checkout links via IntaSend
                savedOrder.setPaymentMethod("INTASEND");
                savedOrder.setPaymentReference(String.valueOf(gatewayResult.get("trackingId")));
                orderRepository.save(savedOrder);

                return ResponseEntity.ok(Map.of(
                        "status", "redirect",
                        "paymentMethod", "INTASEND",
                        "checkoutUrl", gatewayResult.get("checkoutUrl"),
                        "orderId", savedOrder.getId()
                ));
            }

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Global marketplace system checkout failure occurred", e);
            return ResponseEntity.internalServerError().body("Checkout generation error: " + e.getMessage());
        }
    }

    // ─── INTASEND WEBHOOK ─────────────────────────────────────────────────────
    @PostMapping("/intasend/webhook")
    public ResponseEntity<?> intasendWebhook(@RequestBody Map<String, Object> payload) {
        log.info("[IntaSend] Processing webhook payload: {}", payload);

        Object stateObj = payload.get("state");
        Object apiRefObj = payload.get("api_ref");

        if (stateObj == null || apiRefObj == null) {
            return ResponseEntity.ok().build();
        }

        String state = String.valueOf(stateObj);
        String apiRef = String.valueOf(apiRefObj);

        // Aligned with modern system orchestration formats ('ORDER-101' instead of 'rotech-order-101')
        if ("COMPLETE".equalsIgnoreCase(state) && apiRef.startsWith("ORDER-")) {
            try {
                Long orderId = Long.parseLong(apiRef.replace("ORDER-", ""));
                orderRepository.findById(orderId).ifPresent(order -> {
                    order.setStatus(CustomerOrder.OrderStatus.CONFIRMED);
                    orderRepository.save(order);

                    emailService.sendOrderConfirmedEmail(
                            order.getBuyer().getEmail(),
                            order.getBuyer().getName() != null ? order.getBuyer().getName() : "Customer",
                            order.getId(),
                            order.getTotalAmount()
                    );
                });
            } catch (NumberFormatException e) {
                log.warn("[IntaSend Webhook Sync Fail] Could not match reference tracking code: {}", apiRef);
            }
        }
        return ResponseEntity.ok().build();
    }

    // ─── MPESA CALLBACK ───────────────────────────────────────────────────────
    @PostMapping("/mpesa/callback")
    public ResponseEntity<?> mpesaCallback(@RequestBody Map<String, Object> payload) {
        log.info("[M-Pesa Callback Triggered] Processing structural data: {}", payload);

        // Optionally parse Safaricom's transaction status arrays here to mark the order as CONFIRMED
        return ResponseEntity.ok().build();
    }

    // ─── GET ORDER STATUS ─────────────────────────────────────────────────────
    @GetMapping("/order-status/{orderId}")
    public ResponseEntity<?> getOrderStatus(@PathVariable Long orderId, Authentication auth) {
        User buyer = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getBuyer().getId().equals(buyer.getId())) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        return ResponseEntity.ok(Map.of(
                "orderId", order.getId(),
                "status", order.getStatus().toString(),
                "paymentMethod", order.getPaymentMethod() != null ? order.getPaymentMethod() : "",
                "totalAmount", order.getTotalAmount()
        ));
    }

    // ─── HELPERS ──────────────────────────────────────────────────────────────
    private String[] splitName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return new String[]{"Customer", ""};
        }
        String[] parts = fullName.trim().split("\\s+", 2);
        return parts.length == 2 ? parts : new String[]{parts[0], ""};
    }

    // ─── ORDER STRUCTURAL BUILDER ─────────────────────────────────────────────
    private CustomerOrder buildOrder(User buyer,
                                     List<OrderRequest.OrderItemRequest> items,
                                     BigDecimal baseUsdAmount) {
        CustomerOrder order = new CustomerOrder();
        order.setBuyer(buyer);

        // Map Double variables inside entities via Double values safely extracted from the base BigDecimal context
        order.setTotalAmount(baseUsdAmount.doubleValue());

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