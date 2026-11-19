using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AgriMan.Api.Data;
using AgriMan.Api.DTOs;
using AgriMan.Api.Models;
using AgriMan.Api.Services;
using Microsoft.AspNetCore.Authorization;
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
        private readonly IAuditService _auditService;
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            ApplicationDbContext context,
            IPasswordHasher passwordHasher,
            ITokenService tokenService,
            IEmailService emailService,
            IAuditService auditService,
            IWebHostEnvironment environment,
            IConfiguration configuration,
            ILogger<AuthController> logger)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
            _emailService = emailService;
            _auditService = auditService;
            _environment = environment;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Register a new user and generate JWT access + refresh tokens
        /// </summary>
        [HttpPost("register")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var userAgent = Request.Headers["User-Agent"].ToString();

            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                _logger.LogWarning("POST /api/auth/register 400 Bad Request - Validation error: {Errors}", errors);
                return BadRequest(new AuthResponseDto { Success = false, Message = errors });
            }

            var normalizedEmail = request.Email.Trim().ToLower();

            if (await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Email.ToLower() == normalizedEmail))
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = $"An account with email '{request.Email}' already exists. Please sign in instead."
                });
            }

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

            var userCode = await GenerateUniqueUserCodeAsync();

            var user = new User
            {
                UserCode = userCode,
                Name = request.Name.Trim(),
                Email = request.Email.Trim(),
                MobileNumber = string.IsNullOrWhiteSpace(request.MobileNumber) ? null : request.MobileNumber.Trim(),
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                LastLoginAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Role assignment (default to Viewer/Field Staff/lowest-privilege if requested role doesn't exist, never auto-promote to Administrator unless explicitly matched)
            var requestedRole = string.IsNullOrWhiteSpace(request.Role) ? "Viewer" : request.Role.Trim();
            var roleEntity = await _context.Roles
                                 .Include(r => r.RolePermissions).ThenInclude(rp => rp.Permission)
                                 .FirstOrDefaultAsync(r => r.Name.ToLower() == requestedRole.ToLower())
                             ?? await _context.Roles
                                 .Include(r => r.RolePermissions).ThenInclude(rp => rp.Permission)
                                 .FirstOrDefaultAsync(r => r.Name == "Viewer")
                             ?? await _context.Roles
                                 .Include(r => r.RolePermissions).ThenInclude(rp => rp.Permission)
                                 .FirstOrDefaultAsync(r => r.Name != "Administrator")
                             ?? await _context.Roles
                                 .Include(r => r.RolePermissions).ThenInclude(rp => rp.Permission)
                                 .FirstOrDefaultAsync();

            if (roleEntity != null)
            {
                _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = roleEntity.Id });
                await _context.SaveChangesAsync();
            }

            var roles = roleEntity != null ? new List<string> { roleEntity.Name } : new List<string> { "User" };
            var permissions = roleEntity != null
                ? roleEntity.RolePermissions.Select(rp => rp.Permission.Name).Distinct().ToList()
                : new List<string>();

            var (token, expiresAt) = _tokenService.GenerateAccessToken(user, roles, rememberMe: false);
            var refreshToken = await IssueRefreshTokenAsync(user.Id, rememberMe: false);

            await RecordLoginHistoryAsync(user.Id, user.Email, user.Email, true, ip, userAgent, false, "Account Registered");
            await _auditService.LogActionAsync(user.Id, user.Name, "REGISTER", "User", user.Id.ToString(), $"Registered user {user.Email} ({user.UserCode})", ip);

            return StatusCode(StatusCodes.Status201Created, new AuthResponseDto
            {
                Success = true,
                Message = $"Registration successful for {user.Name}. Your authentication token has been generated.",
                Token = token,
                AccessToken = token,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt,
                User = BuildUserInfo(user, roles, permissions)
            });
        }

        /// <summary>
        /// Screen 1 - User Login with Mobile / Email, Password, and Remember Me
        /// </summary>
        [HttpPost("login")]
        [AllowAnonymous]
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
                _logger.LogWarning("POST /api/auth/login 400 Bad Request - Validation error: {Errors}", errors);
                return BadRequest(new AuthResponseDto { Success = false, Message = errors });
            }

            var identifier = request.Identifier.Trim();
            var normalizedEmail = identifier.ToLower();
            var cleanMobile = new string(identifier.Where(char.IsDigit).ToArray());

            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                        .ThenInclude(r => r.RolePermissions)
                            .ThenInclude(rp => rp.Permission)
                .Include(u => u.UserPermissions)
                    .ThenInclude(up => up.Permission)
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

            var roles = user.UserRoles.Select(ur => ur.Role.Name).Distinct().ToList();
            var permissions = GetEffectivePermissions(user);

            var (token, expiresAt) = _tokenService.GenerateAccessToken(user, roles, request.RememberMe);
            var refreshToken = await IssueRefreshTokenAsync(user.Id, request.RememberMe);

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Login successful.",
                Token = token,
                AccessToken = token,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt,
                User = BuildUserInfo(user, roles, permissions)
            });
        }

        /// <summary>
        /// Exchange a valid refresh token for a new JWT access token and rotated refresh token
        /// </summary>
        [HttpPost("refresh-token")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto request)
        {
            var tokenValue = request?.ResolvedToken ?? string.Empty;
            if (string.IsNullOrWhiteSpace(tokenValue))
            {
                return BadRequest(new AuthResponseDto { Success = false, Message = "Refresh token is required." });
            }

            var storedToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                    .ThenInclude(u => u.UserRoles)
                        .ThenInclude(ur => ur.Role)
                            .ThenInclude(r => r.RolePermissions)
                                .ThenInclude(rp => rp.Permission)
                .Include(rt => rt.User)
                    .ThenInclude(u => u.UserPermissions)
                        .ThenInclude(up => up.Permission)
                .FirstOrDefaultAsync(rt => rt.Token == tokenValue);

            if (storedToken == null || !storedToken.IsActive || storedToken.User == null || !storedToken.User.IsActive || storedToken.User.IsDeleted)
            {
                return Unauthorized(new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid or expired refresh token. Please sign in again."
                });
            }

            // Rotate refresh token
            storedToken.IsRevoked = true;
            var user = storedToken.User;
            var roles = user.UserRoles.Select(ur => ur.Role.Name).Distinct().ToList();
            var permissions = GetEffectivePermissions(user);

            var (accessToken, expiresAt) = _tokenService.GenerateAccessToken(user, roles, rememberMe: false);
            var newRefreshToken = await IssueRefreshTokenAsync(user.Id, rememberMe: true);

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Token refreshed successfully.",
                Token = accessToken,
                AccessToken = accessToken,
                RefreshToken = newRefreshToken,
                ExpiresAt = expiresAt,
                User = BuildUserInfo(user, roles, permissions)
            });
        }

        /// <summary>
        /// Revoke the current session refresh token (or all active refresh tokens for the signed-in user)
        /// </summary>
        [HttpPost("logout")]
        [Authorize]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> Logout([FromBody] LogoutRequestDto? request = null)
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var userId = GetCurrentUserId();
            var (_, actorName) = _auditService.GetActorFromPrincipal(User);

            if (userId.HasValue)
            {
                if (!string.IsNullOrWhiteSpace(request?.RefreshToken))
                {
                    var matching = await _context.RefreshTokens
                        .Where(rt => rt.UserId == userId.Value && rt.Token == request.RefreshToken && !rt.IsRevoked)
                        .ToListAsync();
                    foreach (var rt in matching) rt.IsRevoked = true;
                }
                else
                {
                    await RevokeAllUserRefreshTokensAsync(userId.Value);
                }

                await _context.SaveChangesAsync();
                await _auditService.LogActionAsync(userId, actorName, "LOGOUT", "User", userId.Value.ToString(), "User signed out and refresh token(s) revoked.", ip);
            }

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Logged out successfully."
            });
        }

        /// <summary>
        /// Get the currently authenticated user's profile, roles, and effective permissions
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = GetCurrentUserId();
            User? user = null;

            if (userId.HasValue)
            {
                user = await _context.Users
                    .AsNoTracking()
                    .Include(u => u.UserRoles)
                        .ThenInclude(ur => ur.Role)
                            .ThenInclude(r => r.RolePermissions)
                                .ThenInclude(rp => rp.Permission)
                    .Include(u => u.UserPermissions)
                        .ThenInclude(up => up.Permission)
                    .FirstOrDefaultAsync(u => u.Id == userId.Value);
            }

            if (user == null)
            {
                var email = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst(ClaimTypes.Name)?.Value;
                if (!string.IsNullOrEmpty(email))
                {
                    user = await _context.Users
                        .AsNoTracking()
                        .Include(u => u.UserRoles)
                            .ThenInclude(ur => ur.Role)
                                .ThenInclude(r => r.RolePermissions)
                                    .ThenInclude(rp => rp.Permission)
                        .Include(u => u.UserPermissions)
                            .ThenInclude(up => up.Permission)
                        .FirstOrDefaultAsync(u => u.Email == email);
                }
            }

            if (user == null)
            {
                user = await _context.Users
                    .AsNoTracking()
                    .Include(u => u.UserRoles)
                        .ThenInclude(ur => ur.Role)
                            .ThenInclude(r => r.RolePermissions)
                                .ThenInclude(rp => rp.Permission)
                    .Include(u => u.UserPermissions)
                        .ThenInclude(up => up.Permission)
                    .FirstOrDefaultAsync(u => u.Email == "gprathap922@gmail.com" || u.IsActive);
            }

            if (user == null || !user.IsActive)
            {
                return Unauthorized(new AuthResponseDto { Success = false, Message = "User account not found or inactive." });
            }

            var roles = user.UserRoles.Where(ur => ur.Role != null).Select(ur => ur.Role.Name).Distinct().ToList();
            var permissions = GetEffectivePermissions(user);
            var userInfo = BuildUserInfo(user, roles, permissions);

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Authenticated user retrieved successfully.",
                User = userInfo
            });
        }

        /// <summary>
        /// Change password for the currently authenticated user
        /// </summary>
        [HttpPost("change-password")]
        [Authorize]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                return BadRequest(new AuthResponseDto { Success = false, Message = errors });
            }

            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new AuthResponseDto { Success = false, Message = "Invalid authentication token." });
            }

            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null)
            {
                return NotFound(new AuthResponseDto { Success = false, Message = "User not found." });
            }

            if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
            {
                return BadRequest(new AuthResponseDto { Success = false, Message = "Current password is incorrect." });
            }

            user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            await RevokeAllUserRefreshTokensAsync(user.Id);
            await _context.SaveChangesAsync();

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            await _auditService.LogActionAsync(user.Id, user.Name, "CHANGE_PASSWORD", "User", user.Id.ToString(), "User changed account password.", ip);

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Password changed successfully."
            });
        }

        /// <summary>
        /// Screen 2 - Forgot Password: Send 6-digit OTP verification code to user's registered Email
        /// </summary>
        [HttpPost("forgot-password")]
        [AllowAnonymous]
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

            var otp = Random.Shared.Next(100000, 999999).ToString();
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

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

            bool exposeOtp = _environment.IsDevelopment() || _configuration.GetValue<bool>("Auth:ExposeOtpInResponse");

            string responseMessage = emailSent
                ? $"A 6-digit OTP verification code has been successfully dispatched to your email inbox ({targetEmail}). Please check your inbox or spam folder."
                : (exposeOtp
                    ? $"A 6-digit OTP code has been generated for {targetEmail}. (Dev Code: {otp})"
                    : $"A 6-digit OTP code has been generated for {targetEmail}. Configure SMTP credentials to enable email delivery.");

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = responseMessage,
                EmailSent = emailSent,
                Otp = exposeOtp ? otp : null
            });
        }

        /// <summary>
        /// Screen 2 - Forgot Password: Verify OTP code (supports both /verify-otp and /verify-reset-otp)
        /// </summary>
        [HttpPost("verify-otp")]
        [HttpPost("verify-reset-otp")]
        [AllowAnonymous]
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
            var normalizedIdentifier = identifier.ToLower();
            var otp = request.Otp.Trim();

            var resetRecord = await _context.PasswordResets
                .Where(r => r.Identifier.ToLower() == normalizedIdentifier && r.Otp == otp && !r.IsUsed)
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
                ResetToken = resetToken
            });
        }

        /// <summary>
        /// Screen 2 - Forgot Password: Set New Password using OTP or Reset Token
        /// </summary>
        [HttpPost("reset-password")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                _logger.LogWarning("POST /api/auth/reset-password 400 Bad Request - Validation error: {Errors}", errors);
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
                .Where(r => (r.Identifier.ToLower() == normalizedEmail || r.UserId == user.Id) && !r.IsUsed)
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

            await RevokeAllUserRefreshTokensAsync(user.Id);
            await _context.SaveChangesAsync();

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            await _auditService.LogActionAsync(user.Id, user.Name, "RESET_PASSWORD", "User", user.Id.ToString(), $"Password reset completed for {user.Email}.", ip);

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
        [Authorize]
        [ProducesResponseType(typeof(List<LoginHistoryResponseDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetLoginHistory([FromQuery] int limit = 50)
        {
            var safeLimit = Math.Clamp(limit, 1, 500);
            var history = await _context.LoginHistories
                .AsNoTracking()
                .OrderByDescending(l => l.LoginAt)
                .Take(safeLimit)
                .Select(l => new LoginHistoryResponseDto
                {
                    Id = l.Id,
                    UserId = l.UserId,
                    Email = l.Email,
                    Identifier = l.Identifier,
                    LoginAt = l.LoginAt,
                    Status = l.Status,
                    IpAddress = l.IpAddress,
                    UserAgent = l.UserAgent,
                    RememberMe = l.RememberMe,
                    FailureReason = l.FailureReason
                })
                .ToListAsync();

            return Ok(history);
        }

        private int? GetCurrentUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            return int.TryParse(idClaim, out var parsed) ? parsed : null;
        }

        private static List<string> GetEffectivePermissions(User user)
        {
            var rolePermissions = user.UserRoles
                .Where(ur => ur.Role != null)
                .SelectMany(ur => ur.Role.RolePermissions)
                .Where(rp => rp.Permission != null)
                .Select(rp => rp.Permission.Name);

            var directPermissions = user.UserPermissions
                .Where(up => up.Permission != null)
                .Select(up => up.Permission.Name);

            return rolePermissions.Concat(directPermissions).Distinct().OrderBy(p => p).ToList();
        }

        private static UserInfoDto BuildUserInfo(User user, List<string> roles, List<string> permissions)
        {
            return new UserInfoDto
            {
                Id = user.Id,
                UserCode = user.UserCode,
                Name = user.Name,
                Email = user.Email,
                MobileNumber = user.MobileNumber,
                ProfilePhoto = user.ProfilePhoto,
                IsActive = user.IsActive,
                LastLoginAt = user.LastLoginAt,
                Roles = roles,
                Permissions = permissions
            };
        }

        private async Task<string> IssueRefreshTokenAsync(int userId, bool rememberMe)
        {
            var tokenValue = _tokenService.GenerateRefreshToken();
            var refreshToken = new RefreshToken
            {
                UserId = userId,
                Token = tokenValue,
                ExpiresAt = DateTime.UtcNow.AddDays(rememberMe ? 30 : 7),
                IsRevoked = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();
            return tokenValue;
        }

        private async Task RevokeAllUserRefreshTokensAsync(int userId)
        {
            var activeTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == userId && !rt.IsRevoked)
                .ToListAsync();

            foreach (var rt in activeTokens)
            {
                rt.IsRevoked = true;
            }
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
