package RotechMarketplace.globalmarketplace.DTOs;

import lombok.Data;

@Data

public class TrackingUpdateRequest {
    private String courierName;
    private String trackingNumber;
    private String trackingUrl;
    private String estimatedDelivery;
}
