package RotechMarketplace.globalmarketplace.Services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.name}")
    private String fromName;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // ─── Generic HTML email sender ────────────────────────────────────────────
    public void sendHtmlEmail(String toEmail, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            System.err.println("Failed to send email to " + toEmail + ": " + e.getMessage());
        }
    }

    // ─── Shared header & footer blocks (Your Original Styling) ────────────────
    private String emailHeader(String subtitle) {
        return """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6);
                          padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Rotech Marketplace</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">%s</p>
              </div>
              <div style="background: #ffffff; padding: 30px;
                          border: 1px solid #e5e7eb; border-top: none;">
            """.formatted(subtitle);
    }

    private String emailFooter() {
        return """
              </div>
              <div style="background: #f9fafb; padding: 20px;
                          border: 1px solid #e5e7eb; border-top: none;
                          border-radius: 0 0 12px 12px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  &copy; 2026 Global Marketplace. All rights reserved.
                </p>
              </div>
            </div>
            """;
    }

    private String ctaButton(String label) {
        return """
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:5173/my-orders"
                 style="background: linear-gradient(135deg, #6366f1, #8b5cf6);
                        color: white; padding: 12px 30px; border-radius: 8px;
                        text-decoration: none; font-weight: bold; font-size: 14px;">
                %s
              </a>
            </div>
            """.formatted(label);
    }

    // ─── Order Confirmed ──────────────────────────────────────────────────────
    public void sendOrderConfirmedEmail(String buyerEmail, String buyerName,
                                        Long orderId, Double totalAmount) {
        String subject = "Order #" + orderId + " Confirmed! ✅";
        String html = emailHeader("Order Confirmed") + """
                <h2 style="color: #111827; margin-top: 0;">Thank you for your order! ✅</h2>
                <p style="color: #6b7280;">Hi <strong>%s</strong>,</p>
                <p style="color: #6b7280; line-height: 1.6;">
                  Your payment was successful and order <strong>#%d</strong> is now confirmed.
                  The seller will prepare your item and notify you when it is ready for collection.
                </p>
                <div style="background: #f9fafb; border: 1px solid #e5e7eb;
                            border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <table style="width: 100%%;">
                    <tr>
                      <td style="color: #6b7280; font-size: 14px;">Order ID</td>
                      <td style="color: #111827; font-weight: bold; text-align: right;">#%d</td>
                    </tr>
                    <tr>
                      <td style="color: #6b7280; font-size: 14px; padding-top: 8px;">Total Paid</td>
                      <td style="color: #111827; font-weight: bold; text-align: right; padding-top: 8px;">$%.2f</td>
                    </tr>
                  </table>
                </div>
                """.formatted(buyerName, orderId, orderId, totalAmount)
                + ctaButton("Track My Order") + emailFooter();
        sendHtmlEmail(buyerEmail, subject, html);
    }

    // ─── NEW: Ready for Pickup (Crucial for Buyer Trust) ──────────────────────
    public void sendReadyForPickupEmail(String buyerEmail, String buyerName,
                                        Long orderId, String itemNames,
                                        String pickupLocation,
                                        Double lat, Double lng) {

        // 1. ADD THIS NULL GUARD:
        if (pickupLocation == null || pickupLocation.isEmpty()) {
            pickupLocation = "Please contact the seller for collection details.";
        }

        // 2. Safely generate the Maps URL
        String mapsUrl;
        if (lat != null && lng != null) {
            mapsUrl = "https://www.google.com/maps?q=" + lat + "," + lng;
        } else {
            // Now pickupLocation is guaranteed not to be null
            mapsUrl = "https://www.google.com/maps/search/" + URLEncoder.encode(pickupLocation, StandardCharsets.UTF_8);
        }

        String subject = "Your order #" + orderId + " is ready for pickup! 📦";

        // The rest of your HTML code remains exactly the same...
        String html = emailHeader("Ready for Pickup") + """
            <h2 style="color: #111827; margin-top: 0;">Your item is ready for pickup! 📦</h2>
            <p style="color: #6b7280;">Hi <strong>%s</strong>,</p>
            <p style="color: #6b7280; line-height: 1.6;">
              Great news! Your <strong>%s</strong> is packed and waiting for you at the location below.
            </p>

            <div style="background: #fffbeb; border: 1px solid #fcd34d;
                        border-left: 4px solid #f59e0b; border-radius: 8px;
                        padding: 20px; margin: 20px 0;">
              <h3 style="color: #92400e; margin: 0 0 8px; font-size: 15px;">📍 Pickup Location</h3>
              <p style="color: #78350f; font-size: 14px; margin: 0 0 14px; line-height: 1.5;">%s</p>
              <a href="%s" target="_blank"
                 style="display: inline-block; background: #f59e0b; color: white;
                        padding: 9px 20px; border-radius: 7px;
                        text-decoration: none; font-size: 13px; font-weight: bold;">
                Open in Google Maps →
              </a>
            </div>

            <p style="color: #6b7280; font-size: 13px;">
              ⚠️ Please bring your order ID <strong>#%d</strong> when collecting.
            </p>
            """.formatted(buyerName, itemNames, pickupLocation, mapsUrl, orderId)
                + ctaButton("View My Orders") + emailFooter();

        sendHtmlEmail(buyerEmail, subject, html);
    }
    // ─── NEW: Order Collected (The final confirmation) ────────────────────────
    public void sendOrderCollectedEmail(String buyerEmail, String buyerName,
                                        Long orderId, Double totalAmount,
                                        String itemNames) {
        String subject = "Thanks for collecting your order #" + orderId + "! 🎉";
        String html = emailHeader("Order Collected") + """
                <h2 style="color: #111827; margin-top: 0;">You've collected your item! 🎉</h2>
                <p style="color: #6b7280;">Hi <strong>%s</strong>,</p>
                <p style="color: #6b7280; line-height: 1.6;">
                  Your <strong>%s</strong> has been successfully collected. Thank you for shopping on Global Marketplace!
                </p>
                <div style="background: #f9fafb; border: 1px solid #e5e7eb;
                            border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <table style="width: 100%%;">
                    <tr>
                      <td style="color: #6b7280; font-size: 14px;">Order ID</td>
                      <td style="color: #111827; font-weight: bold; text-align: right;">#%d</td>
                    </tr>
                    <tr>
                      <td style="color: #6b7280; font-size: 14px; padding-top: 8px;">Status</td>
                      <td style="text-align: right; padding-top: 8px;">
                        <span style="background: #d1fae5; color: #065f46;
                                     padding: 4px 10px; border-radius: 20px;
                                     font-size: 12px; font-weight: bold;">COMPLETED ✓</span>
                      </td>
                    </tr>
                  </table>
                </div>
                """.formatted(buyerName, itemNames, orderId)
                + ctaButton("Browse More Products") + emailFooter();
        sendHtmlEmail(buyerEmail, subject, html);
    }

    // ─── Order Cancelled ──────────────────────────────────────────────────────
    public void sendOrderCancelledEmail(String buyerEmail, String buyerName,
                                        Long orderId, String reason) {
        String subject = "Order #" + orderId + " Has Been Cancelled ❌";
        String html = emailHeader("Order Cancelled") + """
            <h2 style="color: #111827; margin-top: 0;">Your order has been cancelled ❌</h2>
            <p style="color: #6b7280;">Hi <strong>%s</strong>,</p>
            <p style="color: #6b7280; line-height: 1.6;">Unfortunately, order <strong>#%d</strong> has been cancelled.</p>
            <div style="background: #fef2f2; border: 1px solid #fecaca;
                        border-left: 4px solid #ef4444; border-radius: 8px;
                        padding: 20px; margin: 20px 0;">
              <h3 style="color: #991b1b; margin: 0 0 8px; font-size: 15px;">❌ Reason</h3>
              <p style="color: #7f1d1d; font-size: 14px; margin: 0;">%s</p>
            </div>
            """.formatted(buyerName, orderId, reason)
                + ctaButton("Browse Marketplace") + emailFooter();
        sendHtmlEmail(buyerEmail, subject, html);
    }
}