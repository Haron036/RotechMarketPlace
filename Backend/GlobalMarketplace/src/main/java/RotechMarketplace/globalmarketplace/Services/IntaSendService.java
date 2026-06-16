package RotechMarketplace.globalmarketplace.Services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.*;

@Service
public class IntaSendService {
    private static final Logger log = LoggerFactory.getLogger(IntaSendService.class);

    @Value("${intasend.publishable.key}")
    private String publishableKey;

    @Value("${intasend.secret.token}")
    private String secretToken;

    @Value("${intasend.mode}")
    private String mode;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    private String getBaseUrl() {
        if (mode == null || !mode.trim().equalsIgnoreCase("live")) {
            return "https://sandbox.intasend.com"; // Default safe path for test keys
        }
        return "https://payment.intasend.com";
    }
    public Map<String, Object> createCheckout(BigDecimal totalKesAmount, Long orderId,
                                              String email, String firstName, String lastName, String country) {

        String url = getBaseUrl() + "/api/v1/checkout/";
        String cleanUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
        String redirectUrl = cleanUrl + "/payment/success?orderId=" + orderId;

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("amount", totalKesAmount);
        body.put("currency", "KES");
        body.put("email", email);
        body.put("first_name", firstName);
        body.put("last_name", lastName);
        body.put("country", (country == null || country.isBlank()) ? "KE" : country.toUpperCase());
        body.put("api_ref", "rotech-order-" + orderId);
        body.put("redirect_url", redirectUrl);
        body.put("public_key", publishableKey);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Token " + secretToken);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            Map<?, ?> responseBody = Objects.requireNonNull(response.getBody());

            Map<String, Object> result = new HashMap<>();
            result.put("checkoutUrl", responseBody.get("url"));
            result.put("trackingId", responseBody.get("id"));
            result.put("gateway", "INTASEND");
            return result;
        } catch (HttpClientErrorException e) {
            log.error("[IntaSend Checkout Error]: {}", e.getResponseBodyAsString());
            throw new RuntimeException("IntaSend deployment failure: " + e.getResponseBodyAsString());
        }
    }
}