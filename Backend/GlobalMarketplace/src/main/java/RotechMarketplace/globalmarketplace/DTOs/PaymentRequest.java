package RotechMarketplace.globalmarketplace.DTOs;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class PaymentRequest {
    private String paymentMethod;   // "MPESA", "INTASEND"
    private BigDecimal amount;      // Base price representation avoiding primitive IEEE 754 drift
    private Double taxRate;         // Optional: e.g., 0.16 for 16% VAT calculation
    private String currency;        // "USD", "KES"
    private String phoneNumber;     // Required for direct M-Pesa STK Push
    private String country;         // ISO Country Code (defaults to "KE")
    private List<OrderRequest.OrderItemRequest> items;
}