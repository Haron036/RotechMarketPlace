package RotechMarketplace.globalmarketplace.Controllers;

import RotechMarketplace.globalmarketplace.Entities.Product;
import RotechMarketplace.globalmarketplace.Entities.User;
import RotechMarketplace.globalmarketplace.Repositories.ProductRepository;
import RotechMarketplace.globalmarketplace.Repositories.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public ProductController(ProductRepository productRepository, UserRepository userRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
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

    // --- Create product with file uploads ---
    @PostMapping(consumes = "multipart/form-data")
    @PreAuthorize("hasRole('SELLER')")
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

                String originalName = file.getOriginalFilename();

                String cleanName = originalName
                        .replaceAll("\\s+", "_")
                        .replaceAll("[^a-zA-Z0-9._-]", "");
                cleanName = cleanName.substring(0, Math.min(50, cleanName.length())); // ← fixed

                String fileName = savedProduct.getId() + "_" + UUID.randomUUID() + "_" + cleanName;

                Path filePath = Paths.get(uploadDir, "products", fileName);
                Files.createDirectories(filePath.getParent());
                Files.write(filePath, file.getBytes());

                String imageUrl = "/uploads/products/" + fileName;
                imageUrls.add(imageUrl);
            }
        }

        savedProduct.setImages(imageUrls);
        savedProduct = productRepository.save(savedProduct);

        return ResponseEntity.ok(savedProduct);
    }

    // --- Update product ---
    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('SELLER')")
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
            List<String> newImageUrls = new ArrayList<>();

            for (MultipartFile file : newImages) {
                if (!file.isEmpty()) {

                    String originalName = file.getOriginalFilename();

                    String cleanName = originalName
                            .replaceAll("\\s+", "_")
                            .replaceAll("[^a-zA-Z0-9._-]", "");
                    cleanName = cleanName.substring(0, Math.min(50, cleanName.length())); // ← fixed

                    String fileName = existing.getId() + "_" + UUID.randomUUID() + "_" + cleanName;

                    Path filePath = Paths.get(uploadDir, "products", fileName);
                    Files.createDirectories(filePath.getParent());
                    Files.write(filePath, file.getBytes());

                    newImageUrls.add("/uploads/products/" + fileName);
                }
            }

            existing.setImages(newImageUrls);
        }

        Product saved = productRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    // --- Delete product ---
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id, Authentication auth) {

        return productRepository.findById(id).map(product -> {

            if (!product.getSeller().getEmail().equals(auth.getName())) {
                return ResponseEntity.status(403).build();
            }

            if (product.getImages() != null) {
                for (String imageUrl : product.getImages()) {
                    try {
                        String relativePath = imageUrl.replace("/uploads/products/", "");
                        Path filePath = Paths.get(uploadDir, relativePath);
                        Files.deleteIfExists(filePath);
                    } catch (IOException ignored) {}
                }
            }

            productRepository.delete(product);
            return ResponseEntity.ok().build();

        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/my-products")
    @PreAuthorize("hasRole('SELLER')")
    public List<Product> getMyProducts(Authentication auth) {
        User seller = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Seller not found"));
        return productRepository.findBySeller(seller);
    }
}