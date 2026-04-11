package RotechMarketplace.globalmarketplace.Controllers;

import RotechMarketplace.globalmarketplace.Entities.CustomerOrder;
import RotechMarketplace.globalmarketplace.Entities.Product;
import RotechMarketplace.globalmarketplace.Entities.Review;
import RotechMarketplace.globalmarketplace.Entities.User;
import RotechMarketplace.globalmarketplace.Repositories.OrderRepository;
import RotechMarketplace.globalmarketplace.Repositories.ProductRepository;
import RotechMarketplace.globalmarketplace.Repositories.ReviewRepository;
import RotechMarketplace.globalmarketplace.Repositories.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {
    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public ReviewController(ReviewRepository reviewRepository,
                            ProductRepository productRepository,
                            UserRepository userRepository,
                            OrderRepository orderRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.userRepository    = userRepository;
        this.orderRepository   = orderRepository;
    }

    // ─── Get all reviews for a product ───────────────────────
    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getProductReviews(@PathVariable Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        List<Map<String, Object>> reviews = reviewRepository
                .findByProductOrderByCreatedAtDesc(product)
                .stream()
                .map(r -> Map.<String, Object>of(
                        "id",        r.getId(),
                        "rating",    r.getRating(),
                        "comment",   r.getComment() != null ? r.getComment() : "",
                        "buyerName", r.getBuyer().getName() != null
                                ? r.getBuyer().getName() : "Anonymous",
                        "createdAt", r.getCreatedAt().toString()
                ))
                .toList();

        return ResponseEntity.ok(reviews);
    }

    // ─── Submit a review ──────────────────────────────────────
    // Only allowed if buyer has a DELIVERED order containing this product
    @PostMapping("/product/{productId}")
    public ResponseEntity<?> submitReview(@PathVariable Long productId,
                                          @RequestBody Map<String, Object> body,
                                          Authentication auth) {
        User buyer = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // ── Check buyer has a DELIVERED order with this product ──
        boolean hasPurchased = orderRepository.findAll().stream()
                .filter(o -> o.getBuyer().getId().equals(buyer.getId()))
                .filter(o -> o.getStatus() == CustomerOrder.OrderStatus.DELIVERED)
                .anyMatch(o -> o.getItems().stream()
                        .anyMatch(item -> item.getProduct().getId().equals(productId)));

        if (!hasPurchased) {
            return ResponseEntity.status(403)
                    .body("You can only review products from delivered orders.");
        }

        // ── Check buyer hasn't already reviewed this product ──
        if (reviewRepository.existsByProductAndBuyer(product, buyer)) {
            return ResponseEntity.badRequest()
                    .body("You have already reviewed this product.");
        }

        // ── Validate rating ───────────────────────────────────
        Integer rating = (Integer) body.get("rating");
        if (rating == null || rating < 1 || rating > 5) {
            return ResponseEntity.badRequest().body("Rating must be between 1 and 5.");
        }

        String comment = (String) body.getOrDefault("comment", "");

        // ── Save review ───────────────────────────────────────
        Review review = new Review();
        review.setProduct(product);
        review.setBuyer(buyer);
        review.setRating(rating);
        review.setComment(comment);
        reviewRepository.save(review);

        // ── Recalculate product rating average ─────────────────
        List<Review> allReviews = reviewRepository.findByProductOrderByCreatedAtDesc(product);
        double avgRating = allReviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);

        product.setRating(Math.round(avgRating * 10.0) / 10.0);
        product.setReviewCount(allReviews.size());
        productRepository.save(product);

        return ResponseEntity.ok(Map.of(
                "message",     "Review submitted successfully",
                "newRating",   product.getRating(),
                "reviewCount", product.getReviewCount()
        ));
    }

    // ─── Check if buyer can review a product ─────────────────
    @GetMapping("/product/{productId}/can-review")
    public ResponseEntity<?> canReview(@PathVariable Long productId,
                                       Authentication auth) {
        User buyer = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        boolean hasPurchased = orderRepository.findAll().stream()
                .filter(o -> o.getBuyer().getId().equals(buyer.getId()))
                .filter(o -> o.getStatus() == CustomerOrder.OrderStatus.DELIVERED)
                .anyMatch(o -> o.getItems().stream()
                        .anyMatch(item -> item.getProduct().getId().equals(productId)));

        boolean alreadyReviewed = reviewRepository.existsByProductAndBuyer(product, buyer);

        return ResponseEntity.ok(Map.of(
                "canReview",       hasPurchased && !alreadyReviewed,
                "hasPurchased",    hasPurchased,
                "alreadyReviewed", alreadyReviewed
        ));
    }
}
