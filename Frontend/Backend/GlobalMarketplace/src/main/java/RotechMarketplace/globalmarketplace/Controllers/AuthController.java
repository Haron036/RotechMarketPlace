package RotechMarketplace.globalmarketplace.Controllers;

import RotechMarketplace.globalmarketplace.DTOs.AuthRequest;
import RotechMarketplace.globalmarketplace.DTOs.AuthResponse;
import RotechMarketplace.globalmarketplace.DTOs.RegisterRequest;
import RotechMarketplace.globalmarketplace.Entities.User;
import RotechMarketplace.globalmarketplace.Repositories.UserRepository;
import RotechMarketplace.globalmarketplace.Security.JwtUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthController(AuthenticationManager authenticationManager,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtils jwtUtils) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    // ─── REGISTER ───────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {

        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already in use");
        }

        // Build and save new user
        User user = new User();
        user.setName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole().toUpperCase()); // Store as "BUYER" or "SELLER"

        userRepository.save(user);

        // Generate token immediately after registration
        String token = jwtUtils.generateToken(user.getEmail());

        return ResponseEntity.ok(new AuthResponse(
                token,
                user.getEmail(),
                user.getName(),
                user.getRole()
        ));
    }

    // ─── LOGIN ──────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {

        // Authenticate credentials
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // Fetch user from DB to get name and role
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate JWT token
        String token = jwtUtils.generateToken(user.getEmail());

        return ResponseEntity.ok(new AuthResponse(
                token,
                user.getEmail(),
                user.getName(),
                user.getRole()
        ));
    }
}
