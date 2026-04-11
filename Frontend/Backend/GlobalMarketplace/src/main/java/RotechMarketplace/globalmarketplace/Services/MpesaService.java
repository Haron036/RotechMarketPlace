package RotechMarketplace.globalmarketplace.Services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class MpesaService {

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

    // ─── Get OAuth Token ──────────────────────────────────
    private String getAccessToken() {
        String credentials = consumerKey + ":" + consumerSecret;
        String encoded = Base64.getEncoder().encodeToString(credentials.getBytes());

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Basic " + encoded);

        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange(
                baseUrl + "/oauth/v1/generate?grant_type=client_credentials",
                HttpMethod.GET, entity, Map.class
        );

        return (String) response.getBody().get("access_token");
    }

    // ─── Initiate STK Push ────────────────────────────────
    public Map<String, Object> stkPush(String phone, Double amount) {
        String token = getAccessToken();
        String timestamp = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String password = Base64.getEncoder().encodeToString(
                (shortcode + passkey + timestamp).getBytes()
        );

        // Format phone: 0712345678 → 254712345678
        String formattedPhone = phone.startsWith("0")
                ? "254" + phone.substring(1)
                : phone;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        Map<String, Object> body = new HashMap<>();
        body.put("BusinessShortCode", shortcode);
        body.put("Password", password);
        body.put("Timestamp", timestamp);
        body.put("TransactionType", "CustomerPayBillOnline");
        body.put("Amount", amount.intValue());
        body.put("PartyA", formattedPhone);
        body.put("PartyB", shortcode);
        body.put("PhoneNumber", formattedPhone);
        body.put("CallBackURL", callbackUrl);
        body.put("AccountReference", "RotechMarketplace");
        body.put("TransactionDesc", "Purchase");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.exchange(
                baseUrl + "/mpesa/stkpush/v1/processrequest",
                HttpMethod.POST, entity, Map.class
        );

        return response.getBody();
    }
}
