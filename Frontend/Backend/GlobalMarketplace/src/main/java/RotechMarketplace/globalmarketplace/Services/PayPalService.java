package RotechMarketplace.globalmarketplace.Services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class PayPalService {

    @Value("${paypal.client.id}")
    private String clientId;

    @Value("${paypal.client.secret}")
    private String clientSecret;

    @Value("${paypal.mode}")
    private String mode;

    private final RestTemplate restTemplate = new RestTemplate();

    private String getBaseUrl() {
        return mode.equals("live")
                ? "https://api-m.paypal.com"
                : "https://api-m.sandbox.paypal.com";
    }

    // Step 1: Get OAuth access token from PayPal
    public String getAccessToken() {
        String url = getBaseUrl() + "/v1/oauth2/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBasicAuth(clientId, clientSecret);

        HttpEntity<String> entity = new HttpEntity<>("grant_type=client_credentials", headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        return (String) Objects.requireNonNull(response.getBody()).get("access_token");
    }

    // Step 2: Create a PayPal order and return the approval URL
    public Map<String, String> createOrder(Double amount, String currency, Long orderId) {
        String url = getBaseUrl() + "/v2/checkout/orders";
        String accessToken = getAccessToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        // ← FIX: These must be proper Java String variables, not config-style lines
        String returnUrl = "http://localhost:5173/payment/success?orderId=" + orderId;
        String cancelUrl = "http://localhost:5173/payment/cancel?orderId=" + orderId;

        Map<String, Object> body = Map.of(
                "intent", "CAPTURE",
                "purchase_units", List.of(Map.of(
                        "amount", Map.of(
                                "currency_code", currency.toUpperCase(),
                                "value", String.format("%.2f", amount)
                        ),
                        "custom_id", String.valueOf(orderId)
                )),
                "application_context", Map.of(
                        "return_url", returnUrl,
                        "cancel_url", cancelUrl,
                        "brand_name", "Rotech Marketplace",
                        "user_action", "PAY_NOW"
                )
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        Map<String, String> result = new HashMap<>();
        List<Map<String, String>> links = (List<Map<String, String>>) response.getBody().get("links");

        // Extract the approval URL to redirect the user to PayPal
        for (Map<String, String> link : links) {
            if ("approve".equals(link.get("rel"))) {
                result.put("approvalUrl", link.get("href"));
            }
        }
        result.put("paypalOrderId", (String) response.getBody().get("id"));
        return result;
    }

    // Step 3: Capture payment after user approves on PayPal
    public Map captureOrder(String paypalOrderId) {
        String url = getBaseUrl() + "/v2/checkout/orders/" + paypalOrderId + "/capture";
        String accessToken = getAccessToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        HttpEntity<String> entity = new HttpEntity<>("{}", headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        return response.getBody();
    }
}