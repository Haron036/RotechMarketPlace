package RotechMarketplace.globalmarketplace.DTOs;

import lombok.Data;

import java.util.List;
@Data
public class PaymentRequest {
    private String paymentMethod;   // "STRIPE", "PAYPAL", "MPESA"
    private Double amount;
    private String currency;        // "USD", "KES"
    private String phoneNumber;     // M-Pesa only
    private String returnUrl;       // PayPal only
    private String cancelUrl;       // PayPal only
    private List<OrderRequest.OrderItemRequest> items;
}
