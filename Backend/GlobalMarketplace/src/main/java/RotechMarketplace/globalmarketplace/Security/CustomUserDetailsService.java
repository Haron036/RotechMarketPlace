package RotechMarketplace.globalmarketplace.Security;

import RotechMarketplace.globalmarketplace.Entities.User;
import RotechMarketplace.globalmarketplace.Repositories.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // 1. Fetch user from database
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // 2. Sanitize the role (Ensure it's uppercase and has no hidden spaces)
        String rawRole = user.getRole() != null ? user.getRole().trim().toUpperCase() : "USER";
        String authority = "ROLE_" + rawRole;

        // 3. Debugging logs for Render console
        System.out.println("--- Spring Security Debug ---");
        System.out.println("Authenticating: " + user.getEmail());
        System.out.println("DB Role Found: [" + user.getRole() + "]");
        System.out.println("Final Authority: [" + authority + "]");
        System.out.println("-----------------------------");

        // 4. Return the UserDetails object used by Spring Security
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                List.of(new SimpleGrantedAuthority(authority))
        );
    }
}