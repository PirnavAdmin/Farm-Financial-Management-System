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
        (string Token, DateTime Expiration) GenerateAccessToken(
            User user, 
            IEnumerable<string> roles, 
            IEnumerable<string> permissions, 
            bool rememberMe);
        RefreshToken GenerateRefreshToken(int userId);
        (string Token, DateTime Expiration) GenerateToken(User user, bool rememberMe); // compatibility
    }

    public class TokenService : ITokenService
    {
        private readonly IConfiguration _config;

        public TokenService(IConfiguration config)
        {
            _config = config;
        }

        public (string Token, DateTime Expiration) GenerateAccessToken(
            User user, 
            IEnumerable<string> roles, 
            IEnumerable<string> permissions, 
            bool rememberMe)
        {
            var jwtKey = _config["Jwt:Key"] ?? "AGRIMAN_SUPER_SECRET_KEY_FOR_JWT_AUTHENTICATION_2026_FARM_SYSTEM_SETTINGS_USERS";
            var issuer = _config["Jwt:Issuer"] ?? "AgriManAuth";
            var audience = _config["Jwt:Audience"] ?? "AgriManApp";

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim("UserCode", user.UserCode),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email),
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            foreach (var perm in permissions)
            {
                claims.Add(new Claim("Permission", perm));
            }

            // Expiration: 30 days if rememberMe, otherwise 24 hours
            var expiration = rememberMe ? DateTime.UtcNow.AddDays(30) : DateTime.UtcNow.AddHours(24);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = expiration,
                Issuer = issuer,
                Audience = audience,
                SigningCredentials = credentials
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var securityToken = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(securityToken);

            return (tokenString, expiration);
        }

        public (string Token, DateTime Expiration) GenerateToken(User user, bool rememberMe)
        {
            var roles = user.UserRoles?.Select(ur => ur.Role.Name).ToList() ?? new List<string> { "Farmer" };
            var permissions = new List<string>();
            return GenerateAccessToken(user, roles, permissions, rememberMe);
        }

        public RefreshToken GenerateRefreshToken(int userId)
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);

            return new RefreshToken
            {
                UserId = userId,
                Token = Convert.ToBase64String(randomNumber),
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                CreatedAt = DateTime.UtcNow,
                IsRevoked = false
            };
        }
    }
}
