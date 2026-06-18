package RotechMarketplace.globalmarketplace.Security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);
    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;

    public JwtAuthFilter(JwtUtils jwtUtils, UserDetailsService userDetailsService) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = parseJwt(request);

            if (jwt != null && jwtUtils.validateToken(jwt)) {
                String email = jwtUtils.getEmailFromToken(jwt);

                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                    // 1. Clean Extraction: Get roles directly from the secure cryptographed token claims
                    var authorities = jwtUtils.getAuthoritiesFromToken(jwt);

                    // 2. Debug Trace Line: Check exactly what strings are extracted into your terminal
                    System.out.println("DEBUG FILTER [Path: " + request.getRequestURI() + "]: Extracted authorities from JWT payload -> " + authorities);

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    email, // Can pass email string directly for stateless setups
                                    null,
                                    authorities // ◄── Bound securely directly from the token
                            );

                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } else if (request.getRequestURI().contains("/my-products")) {
                System.out.println("DEBUG FILTER: Token was completely missing or expired for secure path /my-products");
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: {}", e.getMessage(), e);
        }

        filterChain.doFilter(request, response);
    }
    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        // Use .trim() to catch hidden spaces and handle case-insensitivity just in case
        if (headerAuth != null && headerAuth.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return headerAuth.substring(7).trim();
        }

        return null;
    }
}