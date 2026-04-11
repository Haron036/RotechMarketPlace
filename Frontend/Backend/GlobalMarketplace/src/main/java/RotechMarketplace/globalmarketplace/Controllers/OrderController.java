package RotechMarketplace.globalmarketplace.Controllers;

import RotechMarketplace.globalmarketplace.DTOs.OrderRequest;
import RotechMarketplace.globalmarketplace.DTOs.OrderResponse;
import RotechMarketplace.globalmarketplace.Entities.CustomerOrder;
import RotechMarketplace.globalmarketplace.Entities.OrderItem;
import RotechMarketplace.globalmarketplace.Entities.Product;
import RotechMarketplace.globalmarketplace.Entities.User;
import RotechMarketplace.globalmarketplace.Repositories.OrderRepository;
import RotechMarketplace.globalmarketplace.Repositories.ProductRepository;
import RotechMarketplace.globalmarketplace.Repositories.UserRepository;
import RotechMarketplace.globalmarketplace.Services.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public OrderController(OrderRepository orderRepository,
                           ProductRepository productRepository,
                           UserRepository userRepository,
                           EmailService emailService) {
        this.orderRepository   = orderRepository;
        this.productRepository = productRepository;
        this.userRepository    = userRepository;
        this.emailService      = emailService;
    }

    // ─── Place a new order ────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> placeOrder(@RequestBody OrderRequest request,
                                        Authentication auth) {
        User buyer = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        CustomerOrder customerOrder = new CustomerOrder();
        customerOrder.setBuyer(buyer);
        customerOrder.setTotalAmount(request.getTotalAmount());

        List<OrderItem> orderItems = new ArrayList<>();
        for (OrderRequest.OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + itemReq.getProductId()));

            if (product.getStock() < itemReq.getQuantity()) {
                return ResponseEntity.badRequest()
                        .body("Insufficient stock for: " + product.getName());
            }

            product.setStock(product.getStock() - itemReq.getQuantity());
            productRepository.save(product);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(customerOrder);
            orderItem.setProduct(product);
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setPrice(itemReq.getPrice());
            orderItems.add(orderItem);
        }

        customerOrder.setItems(orderItems);
        CustomerOrder saved = orderRepository.save(customerOrder);
        return ResponseEntity.ok(OrderResponse.from(saved));
    }

    // ─── Buyer: view my orders ────────────────────────────────────────────────
    @GetMapping("/my-orders")
    public ResponseEntity<List<OrderResponse>> getMyOrders(Authentication auth) {
        User buyer = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<OrderResponse> orders = orderRepository
                .findByBuyerOrderByCreatedAtDesc(buyer)
                .stream()
                .map(OrderResponse::from)
                .toList();

        return ResponseEntity.ok(orders);
    }

    // ─── Buyer: view single order ─────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable Long id,
                                                  Authentication auth) {
        CustomerOrder customerOrder = orderRepository.findById(id).orElse(null);

        if (customerOrder == null) return ResponseEntity.notFound().build();
        if (!customerOrder.getBuyer().getEmail().equals(auth.getName())) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(OrderResponse.from(customerOrder));
    }

    // ─── Buyer: cancel order (PENDING or CONFIRMED only) ─────────────────────
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id,
                                         Authentication auth) {
        CustomerOrder customerOrder = orderRepository.findById(id).orElse(null);

        if (customerOrder == null) return ResponseEntity.notFound().build();

        if (!customerOrder.getBuyer().getEmail().equals(auth.getName())) {
            return ResponseEntity.status(403).body("Access denied");
        }

        if (customerOrder.getStatus() == CustomerOrder.OrderStatus.SHIPPED   ||
                customerOrder.getStatus() == CustomerOrder.OrderStatus.DELIVERED  ||
                customerOrder.getStatus() == CustomerOrder.OrderStatus.CANCELLED) {
            return ResponseEntity.badRequest()
                    .body("Cannot cancel an order that is already " + customerOrder.getStatus());
        }

        // Restore stock
        customerOrder.getItems().forEach(item -> {
            Product product = item.getProduct();
            product.setStock(product.getStock() + item.getQuantity());
            productRepository.save(product);
        });

        customerOrder.setStatus(CustomerOrder.OrderStatus.CANCELLED);
        orderRepository.save(customerOrder);
        return ResponseEntity.ok(Map.of("message", "Order cancelled successfully"));
    }

    // ─── Seller: view orders containing my products ───────────────────────────
    @GetMapping("/seller")
    public ResponseEntity<?> getSellerOrders(Authentication auth) {
        List<OrderResponse> orders = orderRepository.findAll()
                .stream()
                .filter(order -> order.getItems().stream()
                        .anyMatch(item -> item.getProduct()
                                .getSeller()
                                .getEmail()
                                .equals(auth.getName())))
                .map(OrderResponse::from)
                .toList();

        return ResponseEntity.ok(orders);
    }

    // ─── Seller: update order status ──────────────────────────────────────────
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id,
                                               @RequestBody Map<String, String> body,
                                               Authentication auth) {
        try {
            CustomerOrder order = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            boolean isSeller = order.getItems().stream()
                    .anyMatch(item -> item.getProduct()
                            .getSeller()
                            .getEmail()
                            .equals(auth.getName()));

            if (!isSeller) {
                return ResponseEntity.status(403).body("You are not the seller of this order");
            }

            String newStatusStr = body.get("status").toUpperCase();
            CustomerOrder.OrderStatus newStatus =
                    CustomerOrder.OrderStatus.valueOf(newStatusStr);

            validateTransition(order.getStatus(), newStatus);

            order.setStatus(newStatus);
            orderRepository.save(order);

            // ─── Build item names string from actual product names ────────────
            String itemNames = order.getItems().stream()
                    .map(item -> item.getProduct().getName())
                    .collect(Collectors.joining(", "));

            String buyerEmail = order.getBuyer().getEmail();
            String buyerName  = order.getBuyer().getName() != null
                    ? order.getBuyer().getName() : "Customer";

            // ─── Send the right email per status ─────────────────────────────
            switch (newStatus) {
                case CONFIRMED -> emailService.sendOrderConfirmedEmail(
                        buyerEmail, buyerName,
                        order.getId(), order.getTotalAmount());

                case SHIPPED   -> emailService.sendOrderShippedEmail(
                        buyerEmail, buyerName,
                        order.getId(), itemNames);         // ← real product names

                case DELIVERED -> emailService.sendOrderDeliveredEmail(
                        buyerEmail, buyerName,
                        order.getId(), order.getTotalAmount(), itemNames); // ← real product names

                default -> {} // CANCELLED — no email
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Order updated to " + newStatus,
                    "orderId", id,
                    "status",  newStatus
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid status: " + body.get("status"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── Status transition rules ──────────────────────────────────────────────
    private void validateTransition(CustomerOrder.OrderStatus current,
                                    CustomerOrder.OrderStatus next) {
        boolean valid = switch (current) {
            case PENDING   -> next == CustomerOrder.OrderStatus.CONFIRMED ||
                    next == CustomerOrder.OrderStatus.CANCELLED;
            case CONFIRMED -> next == CustomerOrder.OrderStatus.SHIPPED   ||
                    next == CustomerOrder.OrderStatus.CANCELLED;
            case SHIPPED   -> next == CustomerOrder.OrderStatus.DELIVERED ||
                    next == CustomerOrder.OrderStatus.CANCELLED;
            case COMPLETED,
                 DELIVERED,
                 CANCELLED -> false;
        };

        if (!valid) {
            throw new RuntimeException(
                    "Invalid transition: " + current + " to " + next);
        }
    }
}