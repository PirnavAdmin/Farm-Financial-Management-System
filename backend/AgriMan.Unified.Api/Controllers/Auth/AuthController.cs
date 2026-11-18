using AgriMan.Api.Data;
using AgriMan.Api.DTOs;
using AgriMan.Api.Models;
using AgriMan.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgriMan.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/v1/[controller]")]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ITokenService _tokenService;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            ApplicationDbContext context,
            IPasswordHasher passwordHasher,
            ITokenService tokenService,
            IEmailService emailService,
            ILogger<AuthController> logger)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
            _emailService = emailService;
            _logger = logger;
        }

        /// <summary>
        /// Register a new user and automatically generate an authenticated JWT token
        /// </summary>
        /// <param name="request">Registration details (Name, Email, Mobile, Password, ConfirmPassword, Role)</param>
        /// <response code="201">Registration successful, returns JWT Bearer token and user profile</response>
        /// <response code="400">Validation error or Email already exists</response>
        [HttpPost("register")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var userAgent = Request.Headers["User-Agent"].ToString();

            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                _logger.LogWarning("POST /api/Auth/register 400 Bad Request - Validation error: {Errors}", errors);
                return BadRequest(new AuthResponseDto { Success = false, Message = errors });
            }

            var normalizedEmail = request.Email.Trim().ToLower();

            // Check if email already in use
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail))
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = $"An account with email '{request.Email}' already exists. Please sign in instead."
                });
            }

            // Check if mobile already in use
            if (!string.IsNullOrWhiteSpace(request.MobileNumber))
            {
                var cleanMobile = new string(request.MobileNumber.Where(char.IsDigit).ToArray());
                if (cleanMobile.Length >= 10 && await _context.Users.AnyAsync(u => u.MobileNumber != null && u.MobileNumber.EndsWith(cleanMobile.Substring(cleanMobile.Length - 10))))
                {
                    return BadRequest(new AuthResponseDto
                    {
                        Success = false,
                        Message = $"An account with mobile number '{request.MobileNumber}' is already registered."
                    });
                }
            }

            // Generate unique UserCode
            var userCode = await GenerateUniqueUserCodeAsync();

            var user = new User
            {
                UserCode = userCode,
                Name = request.Name.Trim(),
                Email = request.Email.Trim(),
                MobileNumber = string.IsNullOrWhiteSpace(request.MobileNumber) ? null : request.MobileNumber.Trim(),
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Role assignment
            var requestedRole = string.IsNullOrWhiteSpace(request.Role) ? "User" : request.Role.Trim();
            var roleEntity = await _context.Roles.FirstOrDefaultAsync(r => r.Name.ToLower() == requestedRole.ToLower())
                             ?? await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Administrator")
                             ?? await _context.Roles.FirstOrDefaultAsync();

            if (roleEntity != null)
            {
                _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = roleEntity.Id });
                await _context.SaveChangesAsync();
            }

            var roles = roleEntity != null ? new List<string> { roleEntity.Name } : new List<string> { "User" };
            var permissions = await _context.UserPermissions
                .Where(up => up.UserId == user.Id)
                .Select(up => up.Permission.Name)
                .ToListAsync();

            // Generate Token
            var (token, expiresAt) = _tokenService.GenerateAccessToken(user, roles, rememberMe: false);

            // Record initial login in login_history
            await RecordLoginHistoryAsync(user.Id, user.Email, user.Email, true, ip, userAgent, false, "Account Registered");

            return StatusCode(StatusCodes.Status201Created, new AuthResponseDto
            {
                Success = true,
                Message = $"Registration successful for {user.Name}. Your authentication token has been generated.",
                Token = token,
                ExpiresAt = expiresAt,
                User = new UserInfoDto
                {
                    Id = user.Id,
                    UserCode = user.UserCode,
                    Name = user.Name,
                    Email = user.Email,
                    MobileNumber = user.MobileNumber,
                    Roles = roles,
                    Permissions = permissions
                }
            });
        }

        /// <summary>
        /// Screen 1 – User Login with Mobile / Email, Password, and Remember Me
        /// </summary>
        /// <param name="request">Login credentials</param>
        /// <response code="200">Login successful, returns JWT access token and user profile</response>
        /// <response code="400">Validation error or missing fields</response>
        /// <response code="401">Invalid credentials or account inactive</response>
        [HttpPost("login")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var userAgent = Request.Headers["User-Agent"].ToString();

            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                _logger.LogWarning("POST /api/Auth/login 400 Bad Request - Validation error: {Errors}", errors);
                return BadRequest(new AuthResponseDto { Success = false, Message = errors });
            }

            var identifier = request.Identifier.Trim();
            var normalizedEmail = identifier.ToLower();
            var cleanMobile = new string(identifier.Where(char.IsDigit).ToArray());

            // Search by Email OR Mobile
            var user = await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Include(u => u.UserPermissions).ThenInclude(up => up.Permission)
                .FirstOrDefaultAsync(u =>
                    u.Email.ToLower() == normalizedEmail ||
                    u.MobileNumber == identifier ||
                    (!string.IsNullOrEmpty(u.MobileNumber) && cleanMobile.Length >= 10 && u.MobileNumber.EndsWith(cleanMobile.Substring(cleanMobile.Length - 10)))
                );

            if (user == null)
            {
                await RecordLoginHistoryAsync(null, identifier, null, false, ip, userAgent, request.RememberMe, "User not found with provided Email/Mobile.");
                return Unauthorized(new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid Mobile/Email or password."
                });
            }

            if (!user.IsActive)
            {
                await RecordLoginHistoryAsync(user.Id, identifier, user.Email, false, ip, userAgent, request.RememberMe, "User account is inactive.");
                return Unauthorized(new AuthResponseDto
                {
                    Success = false,
                    Message = "Account is inactive. Please contact your system administrator."
                });
            }

            bool passwordValid = _passwordHasher.VerifyPassword(request.Password, user.PasswordHash);
            if (!passwordValid)
            {
                await RecordLoginHistoryAsync(user.Id, identifier, user.Email, false, ip, userAgent, request.RememberMe, "Invalid password provided.");
                return Unauthorized(new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid Mobile/Email or password."
                });
            }

            user.LastLoginAt = DateTime.UtcNow;
            await RecordLoginHistoryAsync(user.Id, identifier, user.Email, true, ip, userAgent, request.RememberMe, null);
            await _context.SaveChangesAsync();

            var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
            var permissions = user.UserPermissions.Select(up => up.Permission.Name).ToList();

            var (token, expiresAt) = _tokenService.GenerateAccessToken(user, roles, request.RememberMe);

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Login successful.",
                Token = token,
                ExpiresAt = expiresAt,
                User = new UserInfoDto
                {
                    Id = user.Id,
                    UserCode = user.UserCode,
                    Name = user.Name,
                    Email = user.Email,
                    MobileNumber = user.MobileNumber,
                    ProfilePhoto = user.ProfilePhoto,
                    Roles = roles,
                    Permissions = permissions
                }
            });
        }

        /// <summary>
        /// Screen 2 – Forgot Password: Send OTP verification code directly to user's valid Email
        /// </summary>
        /// <param name="request">Mobile or Email identifier</param>
        /// <response code="200">OTP generated, stored in password_resets, and sent to valid email</response>
        /// <response code="404">User not found</response>
        [HttpPost("forgot-password")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request?.Identifier))
            {
                return BadRequest(new AuthResponseDto { Success = false, Message = "Mobile or Email is required." });
            }

            var identifier = request.Identifier.Trim();
            var normalizedEmail = identifier.ToLower();
            var cleanMobile = new string(identifier.Where(char.IsDigit).ToArray());

            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Email.ToLower() == normalizedEmail ||
                u.MobileNumber == identifier ||
                (!string.IsNullOrEmpty(u.MobileNumber) && cleanMobile.Length >= 10 && u.MobileNumber.EndsWith(cleanMobile.Substring(cleanMobile.Length - 10)))
            );

            if (user == null)
            {
                return NotFound(new AuthResponseDto
                {
                    Success = false,
                    Message = $"No registered account found with '{identifier}'."
                });
            }

            // Generate 6-digit OTP
            var otp = Random.Shared.Next(100000, 999999).ToString();
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

            // Record in password_resets table
            var passwordReset = new PasswordReset
            {
                Identifier = identifier,
                UserId = user.Id,
                Otp = otp,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                IsVerified = false,
                IsUsed = false,
                IpAddress = ip
            };
            _context.PasswordResets.Add(passwordReset);

            user.PasswordResetToken = otp;
            user.ResetTokenExpires = DateTime.UtcNow.AddMinutes(15);
            await _context.SaveChangesAsync();

            // Send real email directly to user's valid registered email address
            bool emailSent = false;
            string targetEmail = !string.IsNullOrWhiteSpace(user.Email) ? user.Email : (identifier.Contains('@') ? identifier : string.Empty);

            if (!string.IsNullOrWhiteSpace(targetEmail))
            {
                try
                {
                    emailSent = await _emailService.SendPasswordResetOtpAsync(targetEmail, user.Name, otp);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred sending password reset email to {Email}", targetEmail);
                }
            }

            string responseMessage = emailSent
                ? $"A 6-digit OTP verification code has been successfully dispatched to your email inbox ({targetEmail}). Please check your inbox or spam folder."
                : $"A 6-digit OTP code has been generated for {targetEmail}. (Code: {otp})";

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = responseMessage,
                EmailSent = emailSent,
                Otp = otp // Included for immediate Swagger testing/demo convenience
            });
        }

        /// <summary>
        /// Screen 2 – Forgot Password: Verify OTP code
        /// </summary>
        [HttpPost("verify-otp")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request?.Identifier) || string.IsNullOrWhiteSpace(request?.Otp))
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Mobile/Email identifier and OTP code are required."
                });
            }

            var identifier = request.Identifier.Trim();
            var otp = request.Otp.Trim();

            var resetRecord = await _context.PasswordResets
                .Where(r => r.Identifier == identifier && r.Otp == otp && !r.IsUsed)
                .OrderByDescending(r => r.CreatedAt)
                .FirstOrDefaultAsync();

            if (resetRecord == null || resetRecord.ExpiresAt < DateTime.UtcNow)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid or expired OTP code. Please request a new verification code."
                });
            }

            var resetToken = Guid.NewGuid().ToString("N");
            resetRecord.IsVerified = true;
            resetRecord.ResetToken = resetToken;

            if (resetRecord.UserId.HasValue)
            {
                var user = await _context.Users.FindAsync(resetRecord.UserId.Value);
                if (user != null)
                {
                    user.PasswordResetToken = resetToken;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "OTP verified successfully. You may now enter your new password.",
                ResetToken = resetToken,
                Otp = otp
            });
        }

        /// <summary>
        /// Screen 2 – Forgot Password: Set New Password using OTP or Reset Token
        /// </summary>
        [HttpPost("reset-password")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                _logger.LogWarning("POST /api/Auth/reset-password 400 Bad Request - Validation error: {Errors}", errors);
                return BadRequest(new AuthResponseDto { Success = false, Message = errors });
            }

            if (request.NewPassword != request.ConfirmPassword)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "New Password and Confirm Password do not match."
                });
            }

            var identifier = request.Identifier.Trim();
            var normalizedEmail = identifier.ToLower();
            var cleanMobile = new string(identifier.Where(char.IsDigit).ToArray());

            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Email.ToLower() == normalizedEmail ||
                u.MobileNumber == identifier ||
                (!string.IsNullOrEmpty(u.MobileNumber) && cleanMobile.Length >= 10 && u.MobileNumber.EndsWith(cleanMobile.Substring(cleanMobile.Length - 10)))
            );

            if (user == null)
            {
                return BadRequest(new AuthResponseDto { Success = false, Message = "Account not found for the provided identifier." });
            }

            var resetRecord = await _context.PasswordResets
                .Where(r => r.Identifier == identifier && !r.IsUsed)
                .Where(r => (request.ResetToken != null && r.ResetToken == request.ResetToken) ||
                            (request.Otp != null && r.Otp == request.Otp))
                .OrderByDescending(r => r.CreatedAt)
                .FirstOrDefaultAsync();

            if (resetRecord == null || resetRecord.ExpiresAt < DateTime.UtcNow)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid or expired password reset session. Please request a new OTP."
                });
            }

            user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
            user.PasswordResetToken = null;
            user.ResetTokenExpires = null;
            user.UpdatedAt = DateTime.UtcNow;

            resetRecord.IsUsed = true;
            resetRecord.UsedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Password has been reset successfully. You can now login with your new password."
            });
        }

        /// <summary>
        /// Audit: View Login History records
        /// </summary>
        [HttpGet("login-history")]
        [ProducesResponseType(typeof(List<LoginHistory>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetLoginHistory([FromQuery] int limit = 50)
        {
            var history = await _context.LoginHistories
                .OrderByDescending(l => l.LoginAt)
                .Take(limit)
                .ToListAsync();

            return Ok(history);
        }

        private async Task<string> GenerateUniqueUserCodeAsync()
        {
            var existingCodes = await _context.Users
                .IgnoreQueryFilters()
                .Select(u => u.UserCode)
                .ToListAsync();

            var codeSet = new HashSet<string>(existingCodes.Where(c => !string.IsNullOrEmpty(c)), StringComparer.OrdinalIgnoreCase);

            int maxNum = 0;
            foreach (var code in codeSet)
            {
                if (code.StartsWith("USR-", StringComparison.OrdinalIgnoreCase))
                {
                    if (int.TryParse(code.Substring(4), out int parsed) && parsed > maxNum)
                    {
                        maxNum = parsed;
                    }
                }
            }

            int candidateNum = Math.Max(maxNum + 1, codeSet.Count + 1);
            string candidate = $"USR-{candidateNum:D3}";
            while (codeSet.Contains(candidate))
            {
                candidateNum++;
                candidate = $"USR-{candidateNum:D3}";
            }

            return candidate;
        }

        private async Task RecordLoginHistoryAsync(
            int? userId,
            string identifier,
            string? email,
            bool isSuccess,
            string ipAddress,
            string userAgent,
            bool rememberMe,
            string? failureReason)
        {
            try
            {
                var entry = new LoginHistory
                {
                    UserId = userId,
                    Identifier = identifier,
                    Email = email ?? (identifier.Contains('@') ? identifier : null),
                    LoginAt = DateTime.UtcNow,
                    Status = isSuccess ? "Success" : "Failed",
                    IpAddress = ipAddress,
                    UserAgent = userAgent.Length > 300 ? userAgent.Substring(0, 300) : userAgent,
                    RememberMe = rememberMe,
                    FailureReason = failureReason
                };
                _context.LoginHistories.Add(entry);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to write login history log.");
            }
        }
    }
}
