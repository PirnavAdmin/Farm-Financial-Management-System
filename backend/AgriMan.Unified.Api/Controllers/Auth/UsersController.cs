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
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ILogger<UsersController> _logger;

        public UsersController(
            ApplicationDbContext context,
            IPasswordHasher passwordHasher,
            ILogger<UsersController> logger)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _logger = logger;
        }

        /// <summary>
        /// Get user statistics summary (Total, Active, Inactive)
        /// </summary>
        [HttpGet("stats")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetUserStats()
        {
            var totalUsers = await _context.Users.AsNoTracking().CountAsync();
            var activeUsers = await _context.Users.AsNoTracking().CountAsync(u => u.IsActive);
            var inactiveUsers = await _context.Users.AsNoTracking().CountAsync(u => !u.IsActive);

            return Ok(new
            {
                totalUsers,
                activeUsers,
                inactiveUsers
            });
        }

        /// <summary>
        /// Get Users list with search, role/status filter, and summary statistics (Total, Active, Inactive)
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(UserListResponseDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? search = null,
            [FromQuery] string? role = null,
            [FromQuery] string? status = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            // Overall system stats
            var allUsersQuery = _context.Users.AsNoTracking();
            var totalUsers = await allUsersQuery.CountAsync();
            var activeUsers = await allUsersQuery.CountAsync(u => u.IsActive);
            var inactiveUsers = await allUsersQuery.CountAsync(u => !u.IsActive);

            var query = _context.Users
                .AsNoTracking()
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .AsQueryable();

            // Search filter
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(u =>
                    u.Name.ToLower().Contains(s) ||
                    u.Email.ToLower().Contains(s) ||
                    (u.MobileNumber != null && u.MobileNumber.Contains(s)) ||
                    u.UserCode.ToLower().Contains(s) ||
                    u.UserRoles.Any(ur => ur.Role.Name.ToLower().Contains(s))
                );
            }

            // Role filter
            if (!string.IsNullOrWhiteSpace(role) && role.ToLower() != "all" && role.ToLower() != "all roles")
            {
                query = query.Where(u => u.UserRoles.Any(ur => ur.Role.Name.ToLower() == role.ToLower()));
            }

            // Status filter
            if (!string.IsNullOrWhiteSpace(status) && status.ToLower() != "all" && status.ToLower() != "all statuses")
            {
                if (status.Equals("active", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(u => u.IsActive);
                }
                else if (status.Equals("inactive", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(u => !u.IsActive);
                }
            }

            var totalCount = await query.CountAsync();

            var users = await query
                .OrderBy(u => u.UserCode)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserListItemDto
                {
                    Id = u.Id,
                    UserCode = u.UserCode,
                    Name = u.Name,
                    Email = u.Email,
                    MobileNumber = u.MobileNumber,
                    Role = u.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? "User",
                    Status = u.IsActive ? "Active" : "Inactive",
                    LastLogin = u.LastLoginAt.HasValue
                        ? (u.LastLoginAt.Value.Date == DateTime.UtcNow.Date
                            ? $"Today, {u.LastLoginAt.Value:hh:mm tt}"
                            : u.LastLoginAt.Value.ToString("MMM dd, yyyy"))
                        : "Never",
                    ProfilePhoto = u.ProfilePhoto
                })
                .ToListAsync();

            return Ok(new UserListResponseDto
            {
                Stats = new UserStatsDto
                {
                    TotalUsers = totalUsers,
                    ActiveUsers = activeUsers,
                    InactiveUsers = inactiveUsers
                },
                Users = users,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            });
        }

        /// <summary>
        /// Get user by ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(UserListItemDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetUserById(int id)
        {
            var u = await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (u == null) return NotFound(new { message = $"User with ID {id} not found." });

            return Ok(new UserListItemDto
            {
                Id = u.Id,
                UserCode = u.UserCode,
                Name = u.Name,
                Email = u.Email,
                MobileNumber = u.MobileNumber,
                Role = u.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? "User",
                Status = u.IsActive ? "Active" : "Inactive",
                LastLogin = u.LastLoginAt?.ToString("g"),
                ProfilePhoto = u.ProfilePhoto
            });
        }

        /// <summary>
        /// Add a new user
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(UserListItemDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new { message = "User data is required." });
            }

            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { message = "Name is required." });
            }

            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { message = "Email is required." });
            }

            var cleanEmail = dto.Email.Trim().ToLower();
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == cleanEmail))
            {
                return BadRequest(new { message = $"Email '{dto.Email}' is already registered." });
            }

            var userCode = await GenerateUniqueUserCodeAsync();
            var password = !string.IsNullOrWhiteSpace(dto.Password) ? dto.Password : "Password123!";

            var user = new User
            {
                UserCode = userCode,
                Name = dto.Name.Trim(),
                Email = dto.Email.Trim(),
                MobileNumber = string.IsNullOrWhiteSpace(dto.MobileNumber) ? null : dto.MobileNumber.Trim(),
                PasswordHash = _passwordHasher.HashPassword(password),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Assign role safely
            string roleName = "User";
            if (dto.RoleId > 0)
            {
                var role = await _context.Roles.FindAsync(dto.RoleId);
                if (role != null)
                {
                    _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
                    await _context.SaveChangesAsync();
                    roleName = role.Name;
                }
            }

            return CreatedAtAction(nameof(GetUserById), new { id = user.Id }, new UserListItemDto
            {
                Id = user.Id,
                UserCode = user.UserCode,
                Name = user.Name,
                Email = user.Email,
                MobileNumber = user.MobileNumber,
                Role = roleName,
                Status = "Active",
                LastLogin = "Never",
                ProfilePhoto = null
            });
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

        /// <summary>
        /// Update an existing user
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new { message = "Update data is required." });
            }

            var user = await _context.Users
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return NotFound(new { message = $"User with ID {id} not found." });

            if (!string.IsNullOrWhiteSpace(dto.Name)) user.Name = dto.Name.Trim();

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var cleanEmail = dto.Email.Trim().ToLower();
                var emailInUse = await _context.Users.AnyAsync(u => u.Id != id && u.Email.ToLower() == cleanEmail);
                if (emailInUse)
                {
                    return BadRequest(new { message = $"Email '{dto.Email}' is already in use by another user." });
                }
                user.Email = dto.Email.Trim();
            }

            if (dto.MobileNumber != null) user.MobileNumber = string.IsNullOrWhiteSpace(dto.MobileNumber) ? null : dto.MobileNumber.Trim();
            if (dto.IsActive.HasValue) user.IsActive = dto.IsActive.Value;
            user.UpdatedAt = DateTime.UtcNow;

            if (dto.RoleId.HasValue && dto.RoleId.Value > 0)
            {
                var role = await _context.Roles.FindAsync(dto.RoleId.Value);
                if (role != null)
                {
                    var existingRoles = user.UserRoles.ToList();
                    _context.UserRoles.RemoveRange(existingRoles);
                    _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "User updated successfully." });
        }

        /// <summary>
        /// Delete user (soft delete)
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = $"User with ID {id} not found." });

            user.IsDeleted = true;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"User {user.Name} deleted successfully." });
        }
    }
}

