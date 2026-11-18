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
            // Support both SmtpSettings and EmailSettings configuration shapes
            var host = _config["SmtpSettings:Server"] ?? _config["EmailSettings:Host"] ?? "smtp.gmail.com";
            var portString = _config["SmtpSettings:Port"] ?? _config["EmailSettings:Port"] ?? "587";
            int.TryParse(portString, out int port);
            if (port <= 0) port = 587;

            var username = _config["SmtpSettings:Username"] ?? _config["EmailSettings:Username"] ?? string.Empty;
            var password = _config["SmtpSettings:Password"] ?? _config["EmailSettings:Password"] ?? string.Empty;
            var configuredSender = _config["SmtpSettings:SenderEmail"] ?? _config["EmailSettings:FromEmail"] ?? string.Empty;
            var senderName = _config["SmtpSettings:SenderName"] ?? _config["EmailSettings:FromName"] ?? "AGRIMAN Support";

            var senderEmail = !string.IsNullOrWhiteSpace(configuredSender)
                ? configuredSender
                : (!string.IsNullOrWhiteSpace(username) ? username : "support@agriman.in");

            var sslVal = _config["SmtpSettings:EnableSsl"] ?? _config["EmailSettings:EnableSsl"] ?? "true";
            bool.TryParse(sslVal, out bool enableSsl);

            _logger.LogInformation("Attempting to dispatch email to {ToEmail} via {Host}:{Port}...", toEmail, host, port);

            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                _logger.LogWarning("SMTP credentials are empty. Email cannot be delivered over the network.");
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
                _logger.LogInformation("Email successfully delivered to {ToEmail} via SMTP.", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {ToEmail} via SMTP ({Host}:{Port}).", toEmail, host, port);
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
<body style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a;"">
    <div style=""max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.06);"">
        <div style=""background: #1b4332; padding: 28px 24px; text-align: center; color: #ffffff;"">
            <h1 style=""margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1.5px;"">🌱 AGRIMAN</h1>
            <p style=""margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; color: #d8f3dc;"">Farm Management System</p>
        </div>
        <div style=""padding: 32px 28px;"">
            <h2 style=""margin: 0 0 16px 0; font-size: 18px; color: #1e293b;"">Password Reset Request</h2>
            <p style=""font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;"">
                Hello <strong>{System.Net.WebUtility.HtmlEncode(userName ?? "Valued Farmer / User")}</strong>,
            </p>
            <p style=""font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;"">
                We received a request to reset your password for your AGRIMAN account associated with <strong>{toEmail}</strong>.
            </p>
            <div style=""text-align: center; margin: 28px 0;"">
                <div style=""display: inline-block; background: #e8f5e9; border: 2px dashed #2d6a4f; border-radius: 10px; padding: 16px 36px;"">
                    <span style=""font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1b4332; font-family: 'Courier New', monospace;"">{otp}</span>
                </div>
                <p style=""font-size: 12px; color: #64748b; margin-top: 8px;"">Use this 6-digit verification code to complete your password reset.</p>
            </div>
            <p style=""font-size: 13px; line-height: 1.5; color: #64748b; margin: 0 0 12px 0;"">
                ⏱️ This code will expire in <strong>15 minutes</strong>.
            </p>
            <p style=""font-size: 13px; line-height: 1.5; color: #b91c1c; margin: 0 0 24px 0;"">
                ⚠️ If you did not request this verification code, please ignore this email or contact support immediately.
            </p>
            <hr style=""border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;"" />
            <p style=""font-size: 12px; color: #94a3b8; text-align: center; margin: 0;"">
                &copy; {DateTime.UtcNow.Year} AGRIMAN Farm Management System. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>";

            return await SendEmailAsync(toEmail, subject, htmlBody, isHtml: true);
        }
    }
}
