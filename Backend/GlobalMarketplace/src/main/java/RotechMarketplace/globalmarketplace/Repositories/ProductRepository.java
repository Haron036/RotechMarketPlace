package RotechMarketplace.globalmarketplace.Repositories;

import RotechMarketplace.globalmarketplace.Entities.Product;
import RotechMarketplace.globalmarketplace.Entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // --- Standard Active Fetches ---

    @Query("SELECT p FROM Product p WHERE p.deleted = false")
    List<Product> findAllActive();

    // --- Filtered Searches (Excluding Soft-Deleted Items) ---

    List<Product> findByNameContainingIgnoreCaseAndDeletedFalse(String name);

    List<Product> findByCategoryAndDeletedFalse(String category);

    List<Product> findBySellerAndDeletedFalse(User seller);

    // --- Keep original methods for admin/internal use if needed ---

    List<Product> findByNameContainingIgnoreCase(String name);

    List<Product> findByCategory(String category);

    List<Product> findBySeller(User seller);
}