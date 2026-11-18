using System.ComponentModel.DataAnnotations;

namespace AgriMan.Api.DTOs
{
    /// <summary>
    /// User Registration Request
    /// </summary>
    public class RegisterRequestDto
    {
        /// <summary>
        /// Full Name of the User (e.g. Arjun Mehta)
        /// </summary>
        [Required(ErrorMessage = "Full Name is required.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 100 characters.")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Valid Email address
        /// </summary>
        [Required(ErrorMessage = "Email address is required.")]
        [EmailAddress(ErrorMessage = "Please provide a valid email address.")]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Optional Mobile Number (e.g. +91 98765 43210 or 9876543210)
        /// </summary>
        [MaxLength(25)]
        public string? MobileNumber { get; set; }

        /// <summary>
        /// Password (minimum 6 characters)
        /// </summary>
        [Required(ErrorMessage = "Password is required.")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
        public string Password { get; set; } = string.Empty;

        /// <summary>
        /// Confirmation Password (must match Password)
        /// </summary>
        [Required(ErrorMessage = "Confirm Password is required.")]
        [Compare("Password", ErrorMessage = "Password and Confirm Password do not match.")]
        public string ConfirmPassword { get; set; } = string.Empty;

        /// <summary>
        /// Role name (defaults to 'User' or 'Manager', 'Accountant', 'Administrator')
        /// </summary>
        public string? Role { get; set; } = "User";
    }

    /// <summary>
    /// Screen 1 - Login Request supporting either Mobile or Email
    /// </summary>
    public class LoginRequestDto : IValidatableObject
    {
        private string? _identifier;

        /// <summary>
        /// User's Email or Mobile Number (e.g. test@gmail.com, arjun.mehta@agriman.in, +91 98765 43210, 9876543210)
        /// </summary>
        public string Identifier
        {
            get => !string.IsNullOrWhiteSpace(_identifier)
                ? _identifier
                : (!string.IsNullOrWhiteSpace(Email)
                    ? Email!
                    : (!string.IsNullOrWhiteSpace(Mobile)
                        ? Mobile!
                        : (!string.IsNullOrWhiteSpace(MobileNumber)
                            ? MobileNumber!
                            : (Username ?? string.Empty))));
            set => _identifier = value;
        }

        /// <summary>
        /// Optional alias for Email (accepts "email")
        /// </summary>
        public string? Email { get; set; }

        /// <summary>
        /// Optional alias for Mobile (accepts "mobile")
        /// </summary>
        public string? Mobile { get; set; }

        /// <summary>
        /// Optional alias for MobileNumber (accepts "mobileNumber")
        /// </summary>
        public string? MobileNumber { get; set; }

        /// <summary>
        /// Optional alias for Username (accepts "username" or "userName")
        /// </summary>
        public string? Username { get; set; }

        /// <summary>
        /// User password
        /// </summary>
        [Required(ErrorMessage = "Password is required.")]
        public string Password { get; set; } = string.Empty;

        /// <summary>
        /// Keep user logged in with prolonged session (30 days vs 120 minutes)
        /// </summary>
        public bool RememberMe { get; set; } = false;

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (string.IsNullOrWhiteSpace(Identifier))
            {
                yield return new ValidationResult("Mobile or Email is required.", new[] { nameof(Identifier) });
            }
        }
    }

    /// <summary>
    /// Screen 2 - Forgot Password OTP Request
    /// </summary>
    public class ForgotPasswordRequestDto : IValidatableObject
    {
        private string? _identifier;

        /// <summary>
        /// User's valid registered Email or Mobile Number to receive the verification OTP
        /// </summary>
        public string Identifier
        {
            get => !string.IsNullOrWhiteSpace(_identifier)
                ? _identifier
                : (!string.IsNullOrWhiteSpace(Email)
                    ? Email!
                    : (!string.IsNullOrWhiteSpace(Mobile)
                        ? Mobile!
                        : (Username ?? string.Empty)));
            set => _identifier = value;
        }

        public string? Email { get; set; }
        public string? Mobile { get; set; }
        public string? Username { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (string.IsNullOrWhiteSpace(Identifier))
            {
                yield return new ValidationResult("Mobile or Email is required.", new[] { nameof(Identifier) });
            }
        }
    }

    /// <summary>
    /// Screen 2 - Verify OTP Request
    /// </summary>
    public class VerifyOtpRequestDto : IValidatableObject
    {
        private string? _identifier;

        /// <summary>
        /// Mobile or Email address that requested the OTP
        /// </summary>
        public string Identifier
        {
            get => !string.IsNullOrWhiteSpace(_identifier)
                ? _identifier
                : (!string.IsNullOrWhiteSpace(Email)
                    ? Email!
                    : (!string.IsNullOrWhiteSpace(Mobile)
                        ? Mobile!
                        : (Username ?? string.Empty)));
            set => _identifier = value;
        }

        public string? Email { get; set; }
        public string? Mobile { get; set; }
        public string? Username { get; set; }

        /// <summary>
        /// 6-digit OTP code received in email/message
        /// </summary>
        [Required(ErrorMessage = "OTP code is required.")]
        [StringLength(10, MinimumLength = 4, ErrorMessage = "OTP must be between 4 and 10 characters.")]
        public string Otp { get; set; } = string.Empty;

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (string.IsNullOrWhiteSpace(Identifier))
            {
                yield return new ValidationResult("Mobile or Email is required.", new[] { nameof(Identifier) });
            }
        }
    }

    /// <summary>
    /// Screen 2 - Reset Password Request
    /// </summary>
    public class ResetPasswordRequestDto : IValidatableObject
    {
        private string? _identifier;

        /// <summary>
        /// Mobile or Email address
        /// </summary>
        public string Identifier
        {
            get => !string.IsNullOrWhiteSpace(_identifier)
                ? _identifier
                : (!string.IsNullOrWhiteSpace(Email)
                    ? Email!
                    : (!string.IsNullOrWhiteSpace(Mobile)
                        ? Mobile!
                        : (Username ?? string.Empty)));
            set => _identifier = value;
        }

        public string? Email { get; set; }
        public string? Mobile { get; set; }
        public string? Username { get; set; }

        /// <summary>
        /// OTP code verified on Screen 2 (or pass ResetToken)
        /// </summary>
        public string? Otp { get; set; }

        /// <summary>
        /// Optional Reset Token returned by OTP verification endpoint
        /// </summary>
        public string? ResetToken { get; set; }

        /// <summary>
        /// New password for the account
        /// </summary>
        [Required(ErrorMessage = "New Password is required.")]
        [MinLength(6, ErrorMessage = "New Password must be at least 6 characters.")]
        public string NewPassword { get; set; } = string.Empty;

        /// <summary>
        /// Confirmation of the new password (must match New Password)
        /// </summary>
        [Required(ErrorMessage = "Confirm Password is required.")]
        [Compare("NewPassword", ErrorMessage = "New Password and Confirm Password do not match.")]
        public string ConfirmPassword { get; set; } = string.Empty;

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (string.IsNullOrWhiteSpace(Identifier))
            {
                yield return new ValidationResult("Mobile or Email is required.", new[] { nameof(Identifier) });
            }
        }
    }

    /// <summary>
    /// Generic API response for Authentication endpoints
    /// </summary>
    public class AuthResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Token { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public string? Otp { get; set; } // Provided for quick testing/swagger demo
        public bool? EmailSent { get; set; }
        public string? ResetToken { get; set; }
        public UserInfoDto? User { get; set; }
    }

    public class UserInfoDto
    {
        public int Id { get; set; }
        public string UserCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? MobileNumber { get; set; }
        public string? ProfilePhoto { get; set; }
        public List<string> Roles { get; set; } = new();
        public List<string> Permissions { get; set; } = new();
    }
}
