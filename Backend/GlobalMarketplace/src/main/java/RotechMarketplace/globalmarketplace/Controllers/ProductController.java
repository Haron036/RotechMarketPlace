package RotechMarketplace.globalmarketplace.Controllers;

import RotechMarketplace.globalmarketplace.Entities.Product;
import RotechMarketplace.globalmarketplace.Entities.User;
import RotechMarketplace.globalmarketplace.Repositories.ProductRepository;
import RotechMarketplace.globalmarketplace.Repositories.UserRepository;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")

public class ProductController {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final Cloudinary cloudinary;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ProductController(ProductRepository productRepository,
                             UserRepository userRepository,
                             Cloudinary cloudinary) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.cloudinary = cloudinary;
    }

    @GetMapping
    public List<Product> getAllProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {
        if (search != null) return productRepository.findByNameContainingIgnoreCase(search);
        if (category != null) return productRepository.findByCategory(category);
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping(consumes = "multipart/form-data")
    @PreAuthorize("hasAuthority('ROLE_SELLER')")
    public ResponseEntity<Product> createProduct(
            @RequestPart("product") String productJson,
            @RequestPart("images") List<MultipartFile> images,
            Authentication auth) throws IOException {

        Product product = objectMapper.readValue(productJson, Product.class);

        User seller = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Seller not found"));

        product.setSeller(seller);
        product.setCurrency("USD");

        Product savedProduct = productRepository.save(product);

        List<String> imageUrls = new ArrayList<>();

        for (MultipartFile file : images) {
            if (!file.isEmpty()) {
                Map uploadResult = cloudinary.uploader().upload(
                        file.getBytes(),
                        ObjectUtils.asMap("folder", "products")
                );
                String imageUrl = (String) uploadResult.get("secure_url");
                imageUrls.add(imageUrl);
            }
        }

        savedProduct.setImages(imageUrls);
        savedProduct = productRepository.save(savedProduct);

        return ResponseEntity.ok(savedProduct);
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    @PreAuthorize("hasAuthority('ROLE_SELLER')")
    public ResponseEntity<Product> updateProduct(
            @PathVariable Long id,
            @RequestPart("product") String productJson,
            @RequestPart(value = "images", required = false) List<MultipartFile> newImages,
            Authentication auth) throws IOException {

        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!existing.getSeller().getEmail().equals(auth.getName())) {
            return ResponseEntity.status(403).build();
        }

        Product updated = objectMapper.readValue(productJson, Product.class);

        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setPrice(updated.getPrice());
        existing.setCategory(updated.getCategory());
        existing.setStock(updated.getStock());
        existing.setTags(updated.getTags());

        if (newImages != null && !newImages.isEmpty()) {
            // Delete old images from Cloudinary
            if (existing.getImages() != null) {
                for (String oldUrl : existing.getImages()) {
                    try {
                        // Extract public_id from URL: .../products/filename -> products/filename
                        String publicId = extractPublicId(oldUrl);
                        cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                    } catch (Exception ignored) {}
                }
            }

            List<String> newImageUrls = new ArrayList<>();
            for (MultipartFile file : newImages) {
                if (!file.isEmpty()) {
                    Map uploadResult = cloudinary.uploader().upload(
                            file.getBytes(),
                            ObjectUtils.asMap("folder", "products")
                    );
                    newImageUrls.add((String) uploadResult.get("secure_url"));
                }
            }
            existing.setImages(newImageUrls);
        }

        Product saved = productRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_SELLER')")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id, Authentication auth) {
        return productRepository.findById(id).map(product -> {
            if (!product.getSeller().getEmail().equals(auth.getName())) {
                return ResponseEntity.status(403).build();
            }

            // Check if there are orders (Optional: you can still soft delete regardless)
            // Set the flag instead of actually deleting the row
            product.setDeleted(true);
            productRepository.save(product);

            return ResponseEntity.ok("Product moved to inactive status.");
        }).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/my-products")
    @PreAuthorize("hasAuthority('ROLE_SELLER')")
    public List<Product> getMyProducts(Authentication auth) {
        User seller = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Seller not found"));
        return productRepository.findBySeller(seller);
    }


    private String extractPublicId(String imageUrl) {
        // Find "/upload/" and take everything after it, strip version if present, strip extension
        String marker = "/upload/";
        int idx = imageUrl.indexOf(marker);
        if (idx == -1) return imageUrl;

        String afterUpload = imageUrl.substring(idx + marker.length());

        // Strip version segment like "v1234567890/"
        if (afterUpload.startsWith("v") && afterUpload.contains("/")) {
            afterUpload = afterUpload.substring(afterUpload.indexOf("/") + 1);
        }

        // Strip file extension
        int dotIdx = afterUpload.lastIndexOf(".");
        if (dotIdx != -1) {
            afterUpload = afterUpload.substring(0, dotIdx);
        }

        return afterUpload; // e.g. "products/abc"
    }
}