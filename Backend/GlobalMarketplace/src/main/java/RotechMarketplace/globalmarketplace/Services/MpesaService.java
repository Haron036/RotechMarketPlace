package RotechMarketplace.globalmarketplace.Services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@Service
public class MpesaService {
    private static final Logger log = LoggerFactory.getLogger(MpesaService.class);

    @Value("${mpesa.consumer.key}")
    private String consumerKey;

    @Value("${mpesa.consumer.secret}")
    private String consumerSecret;

    @Value("${mpesa.shortcode}")
    private String shortcode;

    @Value("${mpesa.passkey}")
    private String passkey;

    @Value("${mpesa.callback.url}")
    private String callbackUrl;

    @Value("${mpesa.base.url}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    private String getAccessToken() {
        String credentials = consumerKey + ":" + consumerSecret;
        String encoded = Base64.getEncoder().encodeToString(credentials.getBytes());

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Basic " + encoded);

        HttpEntity<String> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    baseUrl + "/oauth/v1/generate?grant_type=client_credentials",
                    HttpMethod.GET, entity, Map.class
            );
            return (String) Objects.requireNonNull(response.getBody()).get("access_token");
        } catch (Exception e) {
            log.error("[Mpesa Auth Error] Failed to retrieve Daraja token", e);
            throw new RuntimeException("Mpesa authentication engine failed");
        }
    }

    public Map<String, Object> stkPush(String phone, BigDecimal exactKesAmount, Long orderId) {
        String token = getAccessToken();

        // Fix: Force compilation on EAT zone boundaries regardless of host cloud provider context
        String timestamp = ZonedDateTime.now(ZoneId.of("Africa/Nairobi"))
                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        String password = Base64.getEncoder().encodeToString(
                (shortcode + passkey + timestamp).getBytes()
        );

        String formattedPhone = phone.startsWith("0") ? "254" + phone.substring(1) : phone;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        Map<String, Object> body = new HashMap<>();
        body.put("BusinessShortCode", shortcode);
        body.put("Password", password);
        body.put("Timestamp", timestamp);
        body.put("TransactionType", "CustomerPayBillOnline");

        // Fix: String mapping preserves cent precision cleanly without rounding down to 0
        body.put("Amount", exactKesAmount.toPlainString());
        body.put("PartyA", formattedPhone);
        body.put("PartyB", shortcode);
        body.put("PhoneNumber", formattedPhone);
        body.put("CallBackURL", callbackUrl);
        body.put("AccountReference", "ORDER-" + orderId);
        body.put("TransactionDesc", "Rotech Market Order #" + orderId);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    baseUrl + "/mpesa/stkpush/v1/processrequest",
                    HttpMethod.POST, entity, Map.class
            );

            Map<String, Object> result = Objects.requireNonNull(response.getBody());
            result.put("gateway", "MPESA_DIRECT");
            return result;
        } catch (Exception e) {
            log.error("[Mpesa STK Push Failure] Order ID: {}", orderId, e);
            throw new RuntimeException("Mpesa processing error: " + e.getMessage());
        }
    }
}