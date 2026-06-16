package RotechMarketplace.globalmarketplace.Services;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
@Service
public class PricingService {
    private final ExchangeRateService fxService;

    public PricingService(ExchangeRateService fxService) {
        this.fxService = fxService;
    }

    public static class FormattedPrice {
        public final BigDecimal amountInKes;
        public final BigDecimal taxInKes;
        public final BigDecimal totalInKes;

        public FormattedPrice(BigDecimal amountInKes, BigDecimal taxInKes, BigDecimal totalInKes) {
            this.amountInKes = amountInKes;
            this.taxInKes = taxInKes;
            this.totalInKes = totalInKes;
        }
    }

    public FormattedPrice convertUsdToKes(BigDecimal baseUsdAmount, BigDecimal taxRate) {
        if (baseUsdAmount == null || baseUsdAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Price amount must be greater than zero.");
        }

        BigDecimal conversionRate = fxService.getKesRate();

        // Exact conversion to KES rounded to 2 decimal places
        BigDecimal convertedAmount = baseUsdAmount.multiply(conversionRate).setScale(2, RoundingMode.HALF_UP);

        BigDecimal tax = BigDecimal.ZERO;
        if (taxRate != null && taxRate.compareTo(BigDecimal.ZERO) > 0) {
            tax = convertedAmount.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal total = convertedAmount.add(tax).setScale(2, RoundingMode.HALF_UP);

        return new FormattedPrice(convertedAmount, tax, total);
    }
}
