package RotechMarketplace.globalmarketplace.DTOs;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PaymentResponse {
    private String status;           // "success", "pending", "failed"
    private String paymentMethod;
    private String transactionId;
    private String redirectUrl;      // for PayPal
    private String message;
}
