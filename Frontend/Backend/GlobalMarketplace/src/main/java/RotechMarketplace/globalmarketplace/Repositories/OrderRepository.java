package RotechMarketplace.globalmarketplace.Repositories;

import RotechMarketplace.globalmarketplace.Entities.CustomerOrder;
import RotechMarketplace.globalmarketplace.Entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface OrderRepository extends JpaRepository<CustomerOrder, Long> {
    List<CustomerOrder> findByBuyerOrderByCreatedAtDesc(User buyer);


}
