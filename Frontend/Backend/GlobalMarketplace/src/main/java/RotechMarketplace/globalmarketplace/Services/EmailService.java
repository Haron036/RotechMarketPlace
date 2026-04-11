package RotechMarketplace.globalmarketplace.Services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

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

    // ─── Shared header & footer blocks ───────────────────────────────────────
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

    // ─── Order Confirmed email (after payment) ────────────────────────────────
    public void sendOrderConfirmedEmail(String buyerEmail, String buyerName,
                                        Long orderId, Double totalAmount) {
        String subject = "Order #" + orderId + " Confirmed! ✅";
        String html = emailHeader("Order Confirmed") + """
                <h2 style="color: #111827; margin-top: 0;">Thank you for your order! ✅</h2>
                <p style="color: #6b7280;">Hi <strong>%s</strong>,</p>
                <p style="color: #6b7280; line-height: 1.6;">
                  Your payment was successful and order <strong>#%d</strong>
                  is now confirmed. The seller will prepare and ship it shortly.
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
                        <span style="background: #dbeafe; color: #1e40af;
                                     padding: 4px 10px; border-radius: 20px;
                                     font-size: 12px; font-weight: bold;">CONFIRMED ✓</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="color: #6b7280; font-size: 14px; padding-top: 8px;">Total Paid</td>
                      <td style="color: #111827; font-weight: bold;
                                 text-align: right; padding-top: 8px;">$%.2f</td>
                    </tr>
                  </table>
                </div>
                """.formatted(buyerName, orderId, orderId, totalAmount)
                + ctaButton("Track My Order")
                + emailFooter();

        sendHtmlEmail(buyerEmail, subject, html);
    }

    // ─── Order Shipped email ──────────────────────────────────────────────────
    // itemNames = real product names e.g. "Nike Shoe, Adidas Cap"
    public void sendOrderShippedEmail(String buyerEmail, String buyerName,
                                      Long orderId, String itemNames) {
        String subject = "Your " + itemNames + " is on its way! 🚚";
        String html = emailHeader("Order Shipped") + """
                <h2 style="color: #111827; margin-top: 0;">Your order is on its way! 🚚</h2>
                <p style="color: #6b7280;">Hi <strong>%s</strong>,</p>
                <p style="color: #6b7280; line-height: 1.6;">
                  Your <strong>%s</strong> has been shipped and
                  is on its way to you. It should arrive soon!
                </p>
                <div style="background: #f9fafb; border: 1px solid #e5e7eb;
                            border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <table style="width: 100%%;">
                    <tr>
                      <td style="color: #6b7280; font-size: 14px;">Order ID</td>
                      <td style="color: #111827; font-weight: bold; text-align: right;">#%d</td>
                    </tr>
                    <tr>
                      <td style="color: #6b7280; font-size: 14px; padding-top: 8px;">Items</td>
                      <td style="color: #111827; font-weight: bold;
                                 text-align: right; padding-top: 8px;">%s</td>
                    </tr>
                    <tr>
                      <td style="color: #6b7280; font-size: 14px; padding-top: 8px;">Status</td>
                      <td style="text-align: right; padding-top: 8px;">
                        <span style="background: #ede9fe; color: #5b21b6;
                                     padding: 4px 10px; border-radius: 20px;
                                     font-size: 12px; font-weight: bold;">🚚 SHIPPED</span>
                      </td>
                    </tr>
                  </table>
                </div>
                """.formatted(buyerName, itemNames, orderId, itemNames)
                + ctaButton("Track My Order")
                + emailFooter();

        sendHtmlEmail(buyerEmail, subject, html);
    }

    // ─── Order Delivered email ────────────────────────────────────────────────
    // itemNames = real product names e.g. "Nike Shoe, Adidas Cap"
    public void sendOrderDeliveredEmail(String buyerEmail, String buyerName,
                                        Long orderId, Double totalAmount,
                                        String itemNames) {
        String subject = "Your " + itemNames + " has been delivered! 🎉";
        String html = emailHeader("Order Delivered") + """
                <h2 style="color: #111827; margin-top: 0;">Your item(s) have been delivered! 🎉</h2>
                <p style="color: #6b7280;">Hi <strong>%s</strong>,</p>
                <p style="color: #6b7280; line-height: 1.6;">
                  Great news! Your <strong>%s</strong> has been successfully
                  delivered. We hope you love your purchase!
                </p>
                <div style="background: #f9fafb; border: 1px solid #e5e7eb;
                            border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <table style="width: 100%%;">
                    <tr>
                      <td style="color: #6b7280; font-size: 14px;">Order ID</td>
                      <td style="color: #111827; font-weight: bold; text-align: right;">#%d</td>
                    </tr>
                    <tr>
                      <td style="color: #6b7280; font-size: 14px; padding-top: 8px;">Items</td>
                      <td style="color: #111827; font-weight: bold;
                                 text-align: right; padding-top: 8px;">%s</td>
                    </tr>
                    <tr>
                      <td style="color: #6b7280; font-size: 14px; padding-top: 8px;">Status</td>
                      <td style="text-align: right; padding-top: 8px;">
                        <span style="background: #d1fae5; color: #065f46;
                                     padding: 4px 10px; border-radius: 20px;
                                     font-size: 12px; font-weight: bold;">DELIVERED ✓</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="color: #6b7280; font-size: 14px; padding-top: 8px;">Total</td>
                      <td style="color: #111827; font-weight: bold;
                                 text-align: right; padding-top: 8px;">$%.2f</td>
                    </tr>
                  </table>
                </div>
                <p style="color: #6b7280; line-height: 1.6;">
                  If you have any issues with your order, please contact our support team.
                  We are always happy to help!
                </p>
                """.formatted(buyerName, itemNames, orderId, itemNames, totalAmount)
                + ctaButton("View My Orders")
                + emailFooter();

        sendHtmlEmail(buyerEmail, subject, html);
    }
}