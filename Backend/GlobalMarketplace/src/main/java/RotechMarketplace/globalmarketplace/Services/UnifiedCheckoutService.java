package RotechMarketplace.globalmarketplace.Services;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

@Service
public class UnifiedCheckoutService {
    private final PricingService pricingService;
    private final IntaSendService intaSendService;
    private final MpesaService mpesaService;

    public UnifiedCheckoutService(PricingService pricingService,
                                  IntaSendService intaSendService,
                                  MpesaService mpesaService) {
        this.pricingService = pricingService;
        this.intaSendService = intaSendService;
        this.mpesaService = mpesaService;
    }

    /**
     * Entry-point for checkout orchestrations
     * @param paymentMethod Set to "MPESA" for STK Push, or "INTASEND" for card checkout sessions.
     */
    public Map<String, Object> processCheckout(
            BigDecimal baseUsdAmount,
            BigDecimal taxRate,
            Long orderId,
            String email,
            String firstName,
            String lastName,
            String countryCode,
            String phone,
            String paymentMethod) {

        // 1. Calculate the exact pricing details
        PricingService.FormattedPrice price = pricingService.convertUsdToKes(baseUsdAmount, taxRate);

        // 2. Select Gateway Strategy
        if ("MPESA".equalsIgnoreCase(paymentMethod)) {
            if (phone == null || phone.isBlank()) {
                throw new IllegalArgumentException("Phone number is mandatory for direct Mpesa STK Push.");
            }
            return mpesaService.stkPush(phone, price.totalInKes, orderId);
        } else {
            // Defaults to IntaSend link for Web Cards, Mobile Money, or alternative variants
            return intaSendService.createCheckout(
                    price.totalInKes,
                    orderId,
                    email,
                    firstName,
                    lastName,
                    countryCode
            );
        }
    }
}
