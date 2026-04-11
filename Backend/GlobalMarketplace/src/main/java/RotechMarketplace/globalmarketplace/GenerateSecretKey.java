package RotechMarketplace.globalmarketplace;

import java.security.SecureRandom;
import java.util.Base64;

public class GenerateSecretKey {
    public static void main(String[] args) {
        SecureRandom random = new SecureRandom();
        byte[] secret = new byte[64]; // 512 bits — matches HS512
        random.nextBytes(secret);
        System.out.println(Base64.getEncoder().encodeToString(secret));
    }
}
