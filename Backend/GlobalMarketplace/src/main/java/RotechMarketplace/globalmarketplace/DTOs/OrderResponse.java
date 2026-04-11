package RotechMarketplace.globalmarketplace.DTOs;

import RotechMarketplace.globalmarketplace.Entities.CustomerOrder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class OrderResponse {
    private Long id;
    private String status;
    private Double totalAmount;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;

    @Data
    public static class OrderItemResponse {
        private Long productId;
        private String productName;
        private Integer quantity;
        private Double price;
    }

    // ─── Static factory method ────────────────────────────
    public static OrderResponse from(CustomerOrder customerOrder) {
        OrderResponse res = new OrderResponse();
        res.setId(customerOrder.getId());
        res.setStatus(customerOrder.getStatus().name());
        res.setTotalAmount(customerOrder.getTotalAmount());
        res.setCreatedAt(customerOrder.getCreatedAt());
        res.setItems(customerOrder.getItems().stream().map(item -> {
            OrderItemResponse itemRes = new OrderItemResponse();
            itemRes.setProductId(item.getProduct().getId());
            itemRes.setProductName(item.getProduct().getName());
            itemRes.setQuantity(item.getQuantity());
            itemRes.setPrice(item.getPrice());
            return itemRes;
        }).collect(Collectors.toList()));
        return res;
    }
}
