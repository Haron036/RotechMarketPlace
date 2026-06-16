package RotechMarketplace.globalmarketplace.Services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ExchangeRateService {
    private static final Logger log = LoggerFactory.getLogger(ExchangeRateService.class);
    private final RestTemplate restTemplate = new RestTemplate();

    private static final BigDecimal FALLBACK_KES_RATE = new BigDecimal("129.00");
    private final Map<String, CachedRate> rateCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_SECONDS = 43200; // 12 Hours

    private static class CachedRate {
        final BigDecimal rate;
        final Instant expiresAt;

        CachedRate(BigDecimal rate, long ttlSeconds) {
            this.rate = rate;
            this.expiresAt = Instant.now().plusSeconds(ttlSeconds);
        }

        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    public BigDecimal getKesRate() {
        CachedRate cached = rateCache.get("KES");
        if (cached != null && !cached.isExpired()) {
            return cached.rate;
        }

        try {
            String url = "https://open.er-api.com/v6/latest/USD";
            Map<?, ?> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.get("rates") instanceof Map) {
                Map<?, ?> rates = (Map<?, ?>) response.get("rates");
                Object rateObj = rates.get("KES");
                if (rateObj != null) {
                    BigDecimal rate = new BigDecimal(rateObj.toString());
                    rateCache.put("KES", new CachedRate(rate, CACHE_TTL_SECONDS));
                    return rate;
                }
            }
        } catch (Exception e) {
            log.error("Failed to fetch fresh live USD/KES FX rate. Falling back to default baseline.", e);
        }

        return cached != null ? cached.rate : FALLBACK_KES_RATE;
    }

    @Scheduled(cron = "0 0 */12 * * *")
    public void clearCache() {
        rateCache.clear();
    }
}
