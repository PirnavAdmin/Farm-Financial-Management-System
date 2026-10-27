using System.Net;
using System.Net.Mail;

namespace AgriMan.Api.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task<bool> SendEmailAsync(string toEmail, string subject, string body, bool isHtml = true)
        {
            var host = _config["SmtpSettings:Server"] ?? "smtp.gmail.com";
            var portString = _config["SmtpSettings:Port"] ?? "587";
            int.TryParse(portString, out int port);
            if (port <= 0) port = 587;

            var username = _config["SmtpSettings:Username"]?.Trim() ?? string.Empty;
            var password = _config["SmtpSettings:Password"]?.Trim() ?? string.Empty;
            var configuredSender = _config["SmtpSettings:SenderEmail"]?.Trim() ?? string.Empty;
            var senderName = _config["SmtpSettings:SenderName"]?.Trim() ?? "AGRIMAN Farm Management";

            // For Gmail SMTP, sender email must be the authenticated user address or configured sender
            var senderEmail = !string.IsNullOrWhiteSpace(username)
                ? username
                : (!string.IsNullOrWhiteSpace(configuredSender) ? configuredSender : "noreply@agriman.in");

            bool.TryParse(_config["SmtpSettings:EnableSsl"] ?? "true", out bool enableSsl);

            // Log notification for local developers & audit trail
            _logger.LogInformation("================================================================================");
            _logger.LogInformation("EMAIL DISPATCH -> To: {ToEmail} | Subject: {Subject}", toEmail, subject);
            _logger.LogInformation("================================================================================");

            // If credentials are not set, log warning and return false to indicate real network SMTP could not dispatch
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                _logger.LogWarning("SMTP credentials (Username/Password) are not configured in appsettings.json. Direct email to {Email} requires valid SMTP credentials.", toEmail);
                return false;
            }

            try
            {
                using var client = new SmtpClient(host, port)
                {
                    EnableSsl = enableSsl,
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential(username, password),
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    Timeout = 15000
                };

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(senderEmail, senderName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = isHtml
                };

                mailMessage.To.Add(toEmail);

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation("Real email successfully sent via SMTP ({Host}:{Port}) to {ToEmail}.", host, port, toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to deliver email to {ToEmail} via SMTP ({Host}:{Port}). Please verify SMTP host, port, credentials (e.g. Gmail App Password).", toEmail, host, port);
                return false;
            }
        }

        public async Task<bool> SendPasswordResetOtpAsync(string toEmail, string userName, string otp)
        {
            var subject = $"AGRIMAN Password Reset Verification Code: {otp}";

            var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"" />
    <title>AGRIMAN Password Reset</title>
</head>
<body style=""font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;"">
    <div style=""max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);"">
        <div style=""background: linear-gradient(135deg, #15803d 0%, #166534 100%); padding: 28px 24px; text-align: center; color: #ffffff;"">
            <h1 style=""margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px;"">AGRIMAN</h1>
            <p style=""margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;"">Farm Financial Management System</p>
        </div>
        <div style=""padding: 32px 28px;"">
            <h2 style=""margin: 0 0 16px 0; font-size: 18px; color: #0f172a;"">Password Reset Request</h2>
            <p style=""font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;"">
                Hello <strong>{System.Net.WebUtility.HtmlEncode(userName ?? "User")}</strong>,
            </p>
            <p style=""font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;"">
                We received a request to reset your password for your AGRIMAN account associated with <strong>{toEmail}</strong>. Use the 6-digit verification code below to complete the reset:
            </p>
            <div style=""text-align: center; margin: 28px 0;"">
                <div style=""display: inline-block; background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 10px; padding: 16px 36px;"">
                    <span style=""font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #15803d; font-family: 'Courier New', monospace;"">{otp}</span>
                </div>
            </div>
            <p style=""font-size: 13px; line-height: 1.5; color: #64748b; margin: 0 0 12px 0;"">
                ⏱ This code will expire in <strong>15 minutes</strong>.
            </p>
            <p style=""font-size: 13px; line-height: 1.5; color: #dc2626; margin: 0 0 24px 0;"">
                ⚠️ If you did not request this verification code, please ignore this email or notify your system administrator immediately.
            </p>
            <hr style=""border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;"" />
            <p style=""font-size: 12px; color: #94a3b8; text-align: center; margin: 0;"">
                &copy; {DateTime.UtcNow.Year} AGRIMAN Farm Financial Management System. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>";

            return await SendEmailAsync(toEmail, subject, htmlBody, isHtml: true);
        }
    }
}
