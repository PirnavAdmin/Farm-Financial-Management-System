namespace AgriMan.Api.Services
{
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(string toEmail, string subject, string body, bool isHtml = true);
        Task<bool> SendPasswordResetOtpAsync(string toEmail, string userName, string otp);
    }
}
