package RotechMarketplace.globalmarketplace.Security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Component
public class JwtUtils {

    @Value("${app.jwtSecret}")
    private String jwtSecret;

    @Value("${app.jwtExpirationMs}")
    private int jwtExpirationMs;

    /**
     * Generates a signed JWT with the user's email as the subject and their role embedded as a claim.
     */
    public String generateToken(String email, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();
    }

    /**
     * Extracts the email (subject) field from the token payload.
     */
    public String getEmailFromToken(String token) {
        return getClaims(token).getSubject();
    }

    /**
     * Extracts the custom "role" claim value string directly from the token payload.
     */
    public String getRoleFromToken(String token) {
        return getClaims(token).get("role", String.class);
    }

    /**
     * Extracts the "role" claim from the token payload and formats it cleanly into
     * a List of GrantedAuthority objects for Spring Security context registration.
     */
    public List<GrantedAuthority> getAuthoritiesFromToken(String token) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        try {
            // Reusing your private helper method to cleanly extract claims
            Claims claims = getClaims(token);
            String role = claims.get("role", String.class);

            if (role != null && !role.trim().isEmpty()) {
                // Ensure role is normalized with "ROLE_" prefix to match SecurityConfig rules
                if (!role.toUpperCase().startsWith("ROLE_")) {
                    role = "ROLE_" + role.toUpperCase();
                }
                authorities.add(new SimpleGrantedAuthority(role));
            }
        } catch (Exception e) {
            System.err.println("Failed to unpack roles from JWT Claims body: " + e.getMessage());
        }
        return authorities;
    }

    /**
     * Validates that the token signature is authentic, matches our secret key, and hasn't expired.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Reusable private helper method to parse the cryptographically signed JWT token payload claims body.
     */
    private Claims getClaims(String token) {
        return Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(token)
                .getBody();
    }
}