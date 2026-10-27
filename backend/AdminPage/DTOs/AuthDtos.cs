using System.ComponentModel.DataAnnotations;

namespace AgriMan.Api.DTOs
{
    public class LoginRequestDto
    {
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address (e.g. admin@gmail.com).")]
        public string Email { get; set; } = "admin@gmail.com";

        [Required(ErrorMessage = "Password is required.")]
        public string Password { get; set; } = "AgriMan@2026";

        public bool RememberMe { get; set; } = false;
    }

    public class RegisterRequestDto
    {
        [Required(ErrorMessage = "Full Name is required.")]
        [MaxLength(100, ErrorMessage = "Full name cannot exceed 100 characters.")]
        public string FullName { get; set; } = "Arjun Mehta";

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address (e.g. arjun@gmail.com).")]
        [MaxLength(150)]
        public string Email { get; set; } = "arjun@gmail.com";

        [Phone(ErrorMessage = "Invalid phone number format.")]
        [MaxLength(25)]
        public string? PhoneNumber { get; set; } = "+91 98765 43210";

        [Required(ErrorMessage = "Password is required.")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
        public string Password { get; set; } = "AgriMan@2026";

        public string Role { get; set; } = "Administrator";
    }

    public class RefreshTokenRequestDto
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }

    public class ForgotPasswordRequestDto
    {
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address (e.g. admin@gmail.com).")]
        public string Email { get; set; } = "admin@gmail.com";
    }

    public class ResetPasswordRequestDto
    {
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address (e.g. admin@gmail.com).")]
        public string Email { get; set; } = "admin@gmail.com";

        public string? Token { get; set; }

        public string? ResetToken
        {
            get => Token;
            set => Token = value;
        }

        public string? NewPassword { get; set; }

        public string? Password
        {
            get => NewPassword;
            set => NewPassword = value;
        }

        public string? ConfirmPassword { get; set; }
    }

    public class VerifyResetOtpRequestDto
    {
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Verification code is required.")]
        public string Otp { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Token { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public string? Otp { get; set; }
        public UserInfoDto? User { get; set; }
    }

    public class UserInfoDto
    {
        public int Id { get; set; }
        public string UserCode { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string Role { get; set; } = string.Empty;
        public List<string> Roles { get; set; } = new List<string>();
        public List<string> Permissions { get; set; } = new List<string>();
        public DateTime? CreatedAt { get; set; }
    }

    public class UpdateUserDto
    {
        public int? FarmerId { get; set; }

        [Required(ErrorMessage = "Full Name is required.")]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
        public string? Email { get; set; }

        [Phone(ErrorMessage = "Invalid phone number format.")]
        [MaxLength(25)]
        public string? PhoneNumber { get; set; }
    }
}
