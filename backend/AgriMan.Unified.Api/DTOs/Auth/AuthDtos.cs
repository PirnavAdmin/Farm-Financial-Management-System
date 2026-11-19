using System.ComponentModel.DataAnnotations;

namespace AgriMan.Api.DTOs
{
    /// <summary>
    /// User Registration Request (supports both Name/MobileNumber and FullName/PhoneNumber aliases)
    /// </summary>
    public class RegisterRequestDto : IValidatableObject
    {
        private string? _name;
        private string? _mobileNumber;

        /// <summary>
        /// Full Name of the User (e.g. Arjun Mehta). Also accepts "fullName".
        /// </summary>
        public string Name
        {
            get => !string.IsNullOrWhiteSpace(_name) ? _name : (FullName ?? string.Empty);
            set => _name = value;
        }

        /// <summary>
        /// Alias for Name (used by frontend auth.js)
        /// </summary>
        public string? FullName { get; set; }

        /// <summary>
        /// Valid Email address
        /// </summary>
        [Required(ErrorMessage = "Email address is required.")]
        [EmailAddress(ErrorMessage = "Please provide a valid email address.")]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Optional Mobile Number (e.g. +91 98765 43210). Also accepts "phoneNumber".
        /// </summary>
        [MaxLength(25)]
        public string? MobileNumber
        {
            get => !string.IsNullOrWhiteSpace(_mobileNumber) ? _mobileNumber : PhoneNumber;
            set => _mobileNumber = value;
        }

        /// <summary>
        /// Alias for MobileNumber (used by frontend auth.js)
        /// </summary>
        [MaxLength(25)]
        public string? PhoneNumber { get; set; }

        /// <summary>
        /// Password (minimum 6 characters)
        /// </summary>
        [Required(ErrorMessage = "Password is required.")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
        public string Password { get; set; } = string.Empty;

        /// <summary>
        /// Optional Confirmation Password (if supplied, must match Password)
        /// </summary>
        public string? ConfirmPassword { get; set; }

        /// <summary>
        /// Role name (defaults to 'User' or 'Manager', 'Accountant', 'Administrator')
        /// </summary>
        public string? Role { get; set; } = "User";

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var resolvedName = Name?.Trim() ?? string.Empty;
            if (resolvedName.Length < 2 || resolvedName.Length > 100)
            {
                yield return new ValidationResult("Full Name must be between 2 and 100 characters.", new[] { nameof(Name) });
            }

            if (!string.IsNullOrEmpty(ConfirmPassword) && ConfirmPassword != Password)
            {
                yield return new ValidationResult("Password and Confirm Password do not match.", new[] { nameof(ConfirmPassword) });
            }
        }
    }

    /// <summary>
    /// Screen 1 - Login Request supporting either Mobile or Email
    /// </summary>
    public class LoginRequestDto : IValidatableObject
    {
        private string? _identifier;

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

        public string? Email { get; set; }
        public string? Mobile { get; set; }
        public string? MobileNumber { get; set; }
        public string? Username { get; set; }

        [Required(ErrorMessage = "Password is required.")]
        public string Password { get; set; } = string.Empty;

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
        public string? Otp { get; set; }
        public string? ResetToken { get; set; }

        [Required(ErrorMessage = "New Password is required.")]
        [MinLength(6, ErrorMessage = "New Password must be at least 6 characters.")]
        public string NewPassword { get; set; } = string.Empty;

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
    /// Refresh token exchange request
    /// </summary>
    public class RefreshTokenRequestDto
    {
        public string? RefreshToken { get; set; }
        public string? Token { get; set; }

        public string ResolvedToken => !string.IsNullOrWhiteSpace(RefreshToken) ? RefreshToken.Trim() : (Token?.Trim() ?? string.Empty);
    }

    /// <summary>
    /// Logout request (optional refresh token to revoke; if omitted, revokes all active tokens for user)
    /// </summary>
    public class LogoutRequestDto
    {
        public string? RefreshToken { get; set; }
    }

    /// <summary>
    /// Authenticated user password change request
    /// </summary>
    public class ChangePasswordRequestDto
    {
        [Required(ErrorMessage = "Current password is required.")]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "New password is required.")]
        [MinLength(6, ErrorMessage = "New password must be at least 6 characters.")]
        public string NewPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Confirm password is required.")]
        [Compare("NewPassword", ErrorMessage = "New password and confirm password do not match.")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    /// <summary>
    /// Generic API response for Authentication endpoints
    /// </summary>
    public class AuthResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Token { get; set; }
        public string? AccessToken { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public string? Otp { get; set; }
        public bool? EmailSent { get; set; }
        public string? ResetToken { get; set; }
        public UserInfoDto? User { get; set; }
    }

    public class UserInfoDto
    {
        public int Id { get; set; }
        public string UserCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string FullName => Name;
        public string Email { get; set; } = string.Empty;
        public string? MobileNumber { get; set; }
        public string? PhoneNumber => MobileNumber;
        public string? ProfilePhoto { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? LastLoginAt { get; set; }
        public string Role => Roles.FirstOrDefault() ?? "User";
        public string PrimaryRole => Roles.FirstOrDefault() ?? "User";
        public List<string> Roles { get; set; } = new();
        public List<string> Permissions { get; set; } = new();
    }
}
