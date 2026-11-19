using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AgriMan.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace AgriMan.Api.Services
{
    public interface ITokenService
    {
        (string Token, DateTime ExpiresAt) GenerateAccessToken(User user, List<string> roles, bool rememberMe);
        string GenerateRefreshToken();
    }

    public class TokenService : ITokenService
    {
        private readonly IConfiguration _configuration;

        public TokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public (string Token, DateTime ExpiresAt) GenerateAccessToken(User user, List<string> roles, bool rememberMe)
        {
            var jwtKey = _configuration["Jwt:Key"] ?? "AGRIMAN_SUPER_SECURE_JWT_SECRET_KEY_FOR_AUTHENTICATION_2026_!@#$%^";
            var issuer = _configuration["Jwt:Issuer"] ?? "AGRIMAN_API";
            var audience = _configuration["Jwt:Audience"] ?? "AGRIMAN_Frontend";

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim("UserCode", user.UserCode)
            };

            if (!string.IsNullOrEmpty(user.MobileNumber))
            {
                claims.Add(new Claim(ClaimTypes.MobilePhone, user.MobileNumber));
            }

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            // Expiry based on RememberMe
            var expiration = rememberMe
                ? DateTime.UtcNow.AddDays(Convert.ToDouble(_configuration["Jwt:RememberMeExpirationDays"] ?? "30"))
                : DateTime.UtcNow.AddMinutes(Convert.ToDouble(_configuration["Jwt:AccessTokenExpirationMinutes"] ?? "120"));

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expiration,
                signingCredentials: credentials
            );

            return (new JwtSecurityTokenHandler().WriteToken(token), expiration);
        }

        public string GenerateRefreshToken()
        {
            var randomBytes = RandomNumberGenerator.GetBytes(64);
            return Convert.ToBase64String(randomBytes);
        }
    }
}
