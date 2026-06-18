package RotechMarketplace.globalmarketplace.Repositories;

import RotechMarketplace.globalmarketplace.Entities.Product;
import RotechMarketplace.globalmarketplace.Entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByNameContainingIgnoreCase(String name);
    List<Product> findByCategory(String category);
    List<Product> findBySeller(User seller);

    // ─── OPTIMIZED FETCHES FOR HOMEPAGE CATALOG ─────────────────────────────

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.seller WHERE p.deleted = false")
    List<Product> findByDeletedFalseWithSellers();

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.seller WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%')) AND p.deleted = false")
    List<Product> findByNameContainingIgnoreCaseAndDeletedFalseWithSellers(@Param("name") String name);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.seller WHERE p.category = :category AND p.deleted = false")
    List<Product> findByCategoryAndDeletedFalseWithSellers(@Param("category") String category);

    // ─────────────────────────────────────────────────────────────────────────

    @Query("SELECT p FROM Product p WHERE p.deleted = false")
    List<Product> findAllActive();

    List<Product> findByDeletedFalse();
    List<Product> findByNameContainingIgnoreCaseAndDeletedFalse(String name);
    List<Product> findByCategoryAndDeletedFalse(String category);
    List<Product> findBySellerAndDeletedFalse(User seller);
}