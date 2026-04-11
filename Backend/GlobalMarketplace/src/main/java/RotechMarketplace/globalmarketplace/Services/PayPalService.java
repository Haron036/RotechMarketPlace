package RotechMarketplace.globalmarketplace.Services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class PayPalService {

    private static final Logger log = LoggerFactory.getLogger(PayPalService.class);

    // ── Config ────────────────────────────────────────────────────────────────────

    @Value("${paypal.client.id}")
    private String clientId;

    @Value("${paypal.client.secret}")
    private String clientSecret;

    @Value("${paypal.mode}")
    private String mode;

    @Value("${paypal.receiver.email}")
    private String receiverEmail;                     // aronngetich544@gmail.com

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // ── Helpers ───────────────────────────────────────────────────────────────────

    private String getBaseUrl() {
        return "live".equalsIgnoreCase(mode)
                ? "https://api-m.paypal.com"
                : "https://api-m.sandbox.paypal.com";
    }

    private HttpHeaders jsonHeaders(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);
        return headers;
    }

    // ── Step 1: OAuth Access Token ────────────────────────────────────────────────

    public String getAccessToken() {
        String url = getBaseUrl() + "/v1/oauth2/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBasicAuth(clientId, clientSecret);

        HttpEntity<String> entity = new HttpEntity<>("grant_type=client_credentials", headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            String token = (String) Objects.requireNonNull(response.getBody()).get("access_token");
            log.info("[PayPal] Access token obtained successfully.");
            return token;
        } catch (Exception e) {
            log.error("[PayPal] Failed to obtain access token: {}", e.getMessage());
            throw new RuntimeException("PayPal authentication failed: " + e.getMessage());
        }
    }

    // ── Step 2: Create Order (funds directed to YOUR PayPal account) ──────────────
    //
    //   The key field is purchase_units[].payee.email_address = receiverEmail.
    //   PayPal routes the captured funds to that account.
    //   custom_id stores your internal DB order ID so you can look it up on capture.

    public Map<String, String> createOrder(Double amount, String currency, Long orderId) {

        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero.");
        }

        String accessToken = getAccessToken();
        String url         = getBaseUrl() + "/v2/checkout/orders";

        String returnUrl = frontendUrl + "/payment/success?orderId=" + orderId;
        String cancelUrl = frontendUrl + "/payment/cancel?orderId=" + orderId;

        // ── Build purchase unit ───────────────────────────────────────────────────
        Map<String, Object> amountMap = Map.of(
                "currency_code", currency.toUpperCase(),
                "value",         String.format("%.2f", amount)
        );

        // payee = the merchant/seller who RECEIVES the money
        Map<String, Object> payee = Map.of(
                "email_address", receiverEmail         // → aronngetich544@gmail.com
        );

        Map<String, Object> purchaseUnit = new LinkedHashMap<>();
        purchaseUnit.put("reference_id", "rotech-order-" + orderId);
        purchaseUnit.put("description",  "Rotech Marketplace Order #" + orderId);
        purchaseUnit.put("custom_id",    String.valueOf(orderId));   // used on capture
        purchaseUnit.put("amount",       amountMap);
        purchaseUnit.put("payee",        payee);

        // ── Application context ───────────────────────────────────────────────────
        Map<String, Object> appContext = Map.of(
                "brand_name",      "Rotech Marketplace",
                "locale",          "en-US",
                "user_action",     "PAY_NOW",           // button label on PayPal page
                "return_url",      returnUrl,
                "cancel_url",      cancelUrl
        );

        // ── Full request body ─────────────────────────────────────────────────────
        Map<String, Object> body = Map.of(
                "intent",              "CAPTURE",       // capture funds immediately on approval
                "purchase_units",      List.of(purchaseUnit),
                "application_context", appContext
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, jsonHeaders(accessToken));

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            Map<?, ?> responseBody = Objects.requireNonNull(response.getBody());

            String paypalOrderId = (String) responseBody.get("id");
            String approvalUrl   = extractApprovalUrl(responseBody);

            log.info("[PayPal] Order created. PayPal Order ID: {}, Internal Order ID: {}", paypalOrderId, orderId);

            Map<String, String> result = new HashMap<>();
            result.put("paypalOrderId", paypalOrderId);
            result.put("approvalUrl",   approvalUrl);
            return result;

        } catch (HttpClientErrorException e) {
            log.error("[PayPal] Create order failed: {} — {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("PayPal order creation failed: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("[PayPal] Create order exception: {}", e.getMessage());
            throw new RuntimeException("PayPal order creation error: " + e.getMessage());
        }
    }

    // ── Step 3: Capture Payment ───────────────────────────────────────────────────

    public Map<?, ?> captureOrder(String paypalOrderId) {
        if (paypalOrderId == null || paypalOrderId.isBlank()) {
            throw new IllegalArgumentException("PayPal Order ID must not be blank.");
        }

        String accessToken = getAccessToken();
        String url = getBaseUrl() + "/v2/checkout/orders/" + paypalOrderId + "/capture";

        HttpEntity<String> entity = new HttpEntity<>("{}", jsonHeaders(accessToken));

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            Map<?, ?> responseBody = Objects.requireNonNull(response.getBody());
            String status = (String) responseBody.get("status");
            log.info("[PayPal] Capture result for Order {}: status = {}", paypalOrderId, status);
            return responseBody;

        } catch (HttpClientErrorException | HttpServerErrorException e) {
            // PayPal returns error details in the body even on 4xx/5xx
            String errorBody = e.getResponseBodyAsString();
            log.error("[PayPal] Capture HTTP error {}: {}", e.getStatusCode(), errorBody);
            throw new RuntimeException("PayPal capture failed: " + errorBody);

        } catch (Exception e) {
            log.error("[PayPal] Capture exception: {}", e.getMessage());
            throw new RuntimeException("PayPal capture error: " + e.getMessage());
        }
    }
    // ── Step 4: Get Order Details (optional — for verification/debugging) ─────────

    public Map<?, ?> getOrderDetails(String paypalOrderId) {
        String accessToken = getAccessToken();
        String url         = getBaseUrl() + "/v2/checkout/orders/" + paypalOrderId;

        HttpEntity<Void> entity = new HttpEntity<>(jsonHeaders(accessToken));

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            return Objects.requireNonNull(response.getBody());
        } catch (Exception e) {
            log.error("[PayPal] Get order details failed: {}", e.getMessage());
            throw new RuntimeException("Failed to retrieve PayPal order: " + e.getMessage());
        }
    }

    // ── Private: Extract approval URL from PayPal links array ────────────────────

    private String extractApprovalUrl(Map<?, ?> responseBody) {
        Object linksObj = responseBody.get("links");
        if (!(linksObj instanceof List)) {
            throw new RuntimeException("PayPal response missing 'links' array.");
        }

        List<?> links = (List<?>) linksObj;
        for (Object linkObj : links) {
            if (linkObj instanceof Map) {
                Map<?, ?> link = (Map<?, ?>) linkObj;
                if ("approve".equals(link.get("rel"))) {
                    return (String) link.get("href");
                }
            }
        }
        throw new RuntimeException("No 'approve' link found in PayPal response.");
    }
}