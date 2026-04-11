package RotechMarketplace.globalmarketplace.Services;

import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class StripeService {
    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    public PaymentIntent createPaymentIntent(Double amount, String currency) throws Exception {
        Stripe.apiKey = stripeSecretKey;

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount((long) (amount * 100))  // Stripe uses cents
                .setCurrency(currency.toLowerCase())
                .addPaymentMethodType("card")
                .build();

        return PaymentIntent.create(params);
    }
}
