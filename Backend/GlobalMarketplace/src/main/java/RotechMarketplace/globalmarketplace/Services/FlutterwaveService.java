package RotechMarketplace.globalmarketplace.Services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class FlutterwaveService {

    private static final Logger log = LoggerFactory.getLogger(FlutterwaveService.class);
    private static final String FLW_BASE = "https://api.flutterwave.com/v3";

    @Value("${flutterwave.secret.key}")
    private String secretKey;

    @Value("${flutterwave.public.key}")
    private String publicKey;

    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(secretKey);
        return headers;
    }

    // ── Initiate hosted payment (redirect to Flutterwave page) ──────────────
    public Map<String, String> initiatePayment(Double amount, String currency,
                                               Long orderId, String customerEmail,
                                               String customerName) {
        String txRef = "rotech-" + orderId + "-" + System.currentTimeMillis();

        Map<String, Object> customer = Map.of(
                "email", customerEmail,
                "name",  customerName != null ? customerName : "Customer"
        );

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("tx_ref",       txRef);
        body.put("amount",       String.format("%.2f", amount));
        body.put("currency",     currency.toUpperCase());
        body.put("redirect_url", frontendUrl + "/payment/flutterwave/callback");
        body.put("customer",     customer);
        body.put("customizations", Map.of(
                "title",       "Rotech Marketplace",
                "description", "Order #" + orderId,
                "logo",        frontendUrl + "/logo.png"
        ));
        body.put("meta", Map.of("order_id", String.valueOf(orderId)));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, jsonHeaders());

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    FLW_BASE + "/payments", entity, Map.class);

            Map<?, ?> responseBody = Objects.requireNonNull(response.getBody());
            String status = (String) responseBody.get("status");

            if (!"success".equals(status)) {
                throw new RuntimeException("Flutterwave error: " + responseBody.get("message"));
            }

            Map<?, ?> data = (Map<?, ?>) responseBody.get("data");
            String paymentLink = (String) data.get("link");

            log.info("[Flutterwave] Payment link created for order {}: {}", orderId, paymentLink);

            return Map.of(
                    "paymentLink", paymentLink,
                    "txRef",       txRef
            );

        } catch (Exception e) {
            log.error("[Flutterwave] initiatePayment error: {}", e.getMessage());
            throw new RuntimeException("Flutterwave payment initiation failed: " + e.getMessage());
        }
    }

    // ── Verify payment after redirect ────────────────────────────────────────
    public Map<?, ?> verifyPayment(String transactionId) {
        String url = FLW_BASE + "/transactions/" + transactionId + "/verify";
        HttpEntity<Void> entity = new HttpEntity<>(jsonHeaders());

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, Map.class);

            Map<?, ?> body = Objects.requireNonNull(response.getBody());
            log.info("[Flutterwave] Verify response: {}", body.get("status"));
            return body;

        } catch (Exception e) {
            log.error("[Flutterwave] verifyPayment error: {}", e.getMessage());
            throw new RuntimeException("Flutterwave verification failed: " + e.getMessage());
        }
    }
}