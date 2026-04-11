package RotechMarketplace.globalmarketplace.Repositories;

import RotechMarketplace.globalmarketplace.Entities.Product;
import RotechMarketplace.globalmarketplace.Entities.Review;
import RotechMarketplace.globalmarketplace.Entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByProductOrderByCreatedAtDesc(Product product);
    Optional<Review> findByProductAndBuyer(Product product, User buyer);
    boolean existsByProductAndBuyer(Product product, User buyer);

}
