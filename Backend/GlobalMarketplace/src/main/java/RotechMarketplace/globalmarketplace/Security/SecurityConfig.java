package RotechMarketplace.globalmarketplace.Security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, CustomUserDetailsService userDetailsService) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(request -> {
                    var config = new org.springframework.web.cors.CorsConfiguration();
                    config.setAllowedOrigins(List.of(
                            "http://localhost:5173",
                            "http://localhost:3000",
                            "https://rotechmarketplace.onrender.com",
                            "https://globalmarketplace1.onrender.com"
                    ));
                    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
                    config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Cache-Control", "X-Requested-With"));
                    config.setExposedHeaders(List.of("Authorization"));
                    config.setAllowCredentials(true);
                    return config;
                }))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth

                        // ── 1. Pre-flight & Public Auth ──────────────────────────
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()

                        // ── 2. Products ───────────────────────────────────────────
                        // my-products MUST come before the general GET permitAll
                        .requestMatchers(HttpMethod.GET, "/api/products/my-products").hasAuthority("ROLE_SELLER")
                        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/products/**").hasAuthority("ROLE_SELLER")
                        .requestMatchers(HttpMethod.PUT, "/api/products/**").hasAuthority("ROLE_SELLER")
                        .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasAuthority("ROLE_SELLER")

                        // ── 3. Seller Routes ──────────────────────────────────────
                        .requestMatchers("/api/sell/**").hasAuthority("ROLE_SELLER")
                        .requestMatchers(HttpMethod.GET, "/api/orders/seller").hasAuthority("ROLE_SELLER")
                        .requestMatchers(HttpMethod.PUT, "/api/orders/*/status").hasAuthority("ROLE_SELLER")

                        // ── 4. Reviews ────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET, "/api/reviews/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/reviews/**").authenticated()

                        // ── 5. Payments ───────────────────────────────────────────
                        .requestMatchers(HttpMethod.POST, "/api/payments/mpesa/callback").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/payments/intasend/webhook").permitAll()
                        .requestMatchers("/api/payments/**").authenticated()

                        // ── 6. Orders ─────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET, "/api/orders/my-orders").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/orders").authenticated()
                        .requestMatchers("/api/orders/**").authenticated()

                        // ── 7. Static Assets & Internal Routes ─────────────────────
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/error").permitAll() //
                        .requestMatchers("/", "/index.html", "/assets/**", "/*.js", "/*.css", "/*.ico").permitAll()

                        // ── 8. Everything else requires auth ──────────────────────
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}