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
    [Authorize]
    [Route("api/[controller]")]
    [Route("api/v1/[controller]")]
    [Produces("application/json")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IAuditService _auditService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(
            ApplicationDbContext context,
            IPasswordHasher passwordHasher,
            IAuditService auditService,
            ILogger<UsersController> logger)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _auditService = auditService;
            _logger = logger;
        }

        /// <summary>
        /// Get user statistics summary (Total, Active, Inactive)
        /// </summary>
        [HttpGet("stats")]
        [ProducesResponseType(typeof(UserStatsDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetUserStats()
        {
            var totalUsers = await _context.Users.AsNoTracking().CountAsync();
            var activeUsers = await _context.Users.AsNoTracking().CountAsync(u => u.IsActive);
            var inactiveUsers = await _context.Users.AsNoTracking().CountAsync(u => !u.IsActive);

            return Ok(new UserStatsDto
            {
                TotalUsers = totalUsers,
                ActiveUsers = activeUsers,
                InactiveUsers = inactiveUsers
            });
        }

        /// <summary>
        /// Get Users list with search, role/status filter, pagination, and summary statistics
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
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var allUsersQuery = _context.Users.AsNoTracking();
            var totalUsers = await allUsersQuery.CountAsync();
            var activeUsers = await allUsersQuery.CountAsync(u => u.IsActive);
            var inactiveUsers = await allUsersQuery.CountAsync(u => !u.IsActive);

            var query = _context.Users
                .AsNoTracking()
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Include(u => u.UserPermissions).ThenInclude(up => up.Permission)
                .AsQueryable();

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

            if (!string.IsNullOrWhiteSpace(role) && role.ToLower() != "all" && role.ToLower() != "all roles")
            {
                query = query.Where(u => u.UserRoles.Any(ur => ur.Role.Name.ToLower() == role.ToLower()));
            }

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

            var pagedUsers = await query
                .OrderBy(u => u.UserCode)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var users = pagedUsers.Select(MapToUserListItem).ToList();

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
        /// Get user details by ID (including roles and permissions)
        /// </summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(UserListItemDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetUserById(int id)
        {
            var user = await _context.Users
                .AsNoTracking()
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                        .ThenInclude(r => r.RolePermissions)
                            .ThenInclude(rp => rp.Permission)
                .Include(u => u.UserPermissions)
                    .ThenInclude(up => up.Permission)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return NotFound(new { message = $"User with ID {id} not found." });

            return Ok(MapToUserListItem(user));
        }

        /// <summary>
        /// Create a new user (supports RoleId or Role/Roles names and direct Permissions)
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(UserListItemDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
        {
            if (dto == null) return BadRequest(new { message = "User data is required." });
            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest(new { message = "Name is required." });
            if (string.IsNullOrWhiteSpace(dto.Email)) return BadRequest(new { message = "Email is required." });

            var cleanEmail = dto.Email.Trim().ToLower();
            if (await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Email.ToLower() == cleanEmail))
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
                IsActive = dto.IsActive ?? true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var resolvedRoles = await ResolveRolesAsync(dto.RoleId, dto.Role, dto.Roles);
            foreach (var role in resolvedRoles)
            {
                _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
            }

            var resolvedPermissions = await ResolvePermissionsAsync(null, dto.Permissions);
            foreach (var perm in resolvedPermissions)
            {
                _context.UserPermissions.Add(new UserPermission { UserId = user.Id, PermissionId = perm.Id });
            }

            await _context.SaveChangesAsync();

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
            await _auditService.LogActionAsync(actorId, actorName, "CREATE", "User", user.Id.ToString(), $"Created user {user.Name} ({user.Email}, {user.UserCode}).", ip);

            var created = await _context.Users
                .AsNoTracking()
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Include(u => u.UserPermissions).ThenInclude(up => up.Permission)
                .FirstAsync(u => u.Id == user.Id);

            return CreatedAtAction(nameof(GetUserById), new { id = user.Id }, MapToUserListItem(created));
        }

        /// <summary>
        /// Update an existing user (supports RoleId, Role/Roles names, IsActive, and Permissions)
        /// </summary>
        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(UserListItemDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Update data is required." });

            var user = await _context.Users
                .Include(u => u.UserRoles)
                .Include(u => u.UserPermissions)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return NotFound(new { message = $"User with ID {id} not found." });

            if (!string.IsNullOrWhiteSpace(dto.Name)) user.Name = dto.Name.Trim();

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var cleanEmail = dto.Email.Trim().ToLower();
                var emailInUse = await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Id != id && u.Email.ToLower() == cleanEmail);
                if (emailInUse)
                {
                    return BadRequest(new { message = $"Email '{dto.Email}' is already in use by another user." });
                }
                user.Email = dto.Email.Trim();
            }

            if (dto.MobileNumber != null) user.MobileNumber = string.IsNullOrWhiteSpace(dto.MobileNumber) ? null : dto.MobileNumber.Trim();
            if (dto.IsActive.HasValue) user.IsActive = dto.IsActive.Value;
            user.UpdatedAt = DateTime.UtcNow;

            if ((dto.RoleId.HasValue && dto.RoleId.Value > 0) || !string.IsNullOrWhiteSpace(dto.Role) || dto.Roles != null)
            {
                var resolvedRoles = await ResolveRolesAsync(dto.RoleId, dto.Role, dto.Roles);
                if (resolvedRoles.Count > 0)
                {
                    _context.UserRoles.RemoveRange(user.UserRoles.ToList());
                    foreach (var role in resolvedRoles)
                    {
                        _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
                    }
                }
            }

            if (dto.Permissions != null)
            {
                var resolvedPerms = await ResolvePermissionsAsync(null, dto.Permissions);
                _context.UserPermissions.RemoveRange(user.UserPermissions.ToList());
                foreach (var perm in resolvedPerms)
                {
                    _context.UserPermissions.Add(new UserPermission { UserId = user.Id, PermissionId = perm.Id });
                }
            }

            await _context.SaveChangesAsync();

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
            await _auditService.LogActionAsync(actorId, actorName, "UPDATE", "User", user.Id.ToString(), $"Updated user {user.Name} ({user.Email}).", ip);

            var updated = await _context.Users
                .AsNoTracking()
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Include(u => u.UserPermissions).ThenInclude(up => up.Permission)
                .FirstAsync(u => u.Id == user.Id);

            return Ok(MapToUserListItem(updated));
        }

        /// <summary>
        /// Activate or deactivate a user account
        /// </summary>
        [HttpPatch("{id:int}/status")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] UpdateUserStatusDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = $"User with ID {id} not found." });

            user.IsActive = dto.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            if (!dto.IsActive)
            {
                var activeTokens = await _context.RefreshTokens
                    .Where(rt => rt.UserId == id && !rt.IsRevoked)
                    .ToListAsync();
                foreach (var rt in activeTokens) rt.IsRevoked = true;
            }

            await _context.SaveChangesAsync();

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
            var action = dto.IsActive ? "ACTIVATE" : "DEACTIVATE";
            await _auditService.LogActionAsync(actorId, actorName, action, "User", user.Id.ToString(), $"{action} user {user.Name} ({user.Email}).", ip);

            return Ok(new
            {
                success = true,
                id = user.Id,
                isActive = user.IsActive,
                status = user.IsActive ? "Active" : "Inactive",
                message = $"User {user.Name} has been {(user.IsActive ? "activated" : "deactivated")}."
            });
        }

        /// <summary>
        /// Delete user (soft delete)
        /// </summary>
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = $"User with ID {id} not found." });

            user.IsDeleted = true;
            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;

            var activeTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == id && !rt.IsRevoked)
                .ToListAsync();
            foreach (var rt in activeTokens) rt.IsRevoked = true;

            await _context.SaveChangesAsync();

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
            await _auditService.LogActionAsync(actorId, actorName, "DELETE", "User", user.Id.ToString(), $"Soft-deleted user {user.Name} ({user.Email}).", ip);

            return Ok(new { success = true, message = $"User {user.Name} deleted successfully." });
        }

        /// <summary>
        /// Get roles and direct/effective permissions assigned to a user
        /// </summary>
        [HttpGet("{id:int}/permissions")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetUserPermissions(int id)
        {
            var user = await _context.Users
                .AsNoTracking()
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                        .ThenInclude(r => r.RolePermissions)
                            .ThenInclude(rp => rp.Permission)
                .Include(u => u.UserPermissions)
                    .ThenInclude(up => up.Permission)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return NotFound(new { message = $"User with ID {id} not found." });

            var directPermissions = user.UserPermissions.Select(up => up.Permission.Name).Distinct().OrderBy(p => p).ToList();
            var rolePermissions = user.UserRoles
                .SelectMany(ur => ur.Role.RolePermissions)
                .Select(rp => rp.Permission.Name)
                .Distinct()
                .OrderBy(p => p)
                .ToList();
            var effectivePermissions = directPermissions.Concat(rolePermissions).Distinct().OrderBy(p => p).ToList();

            return Ok(new
            {
                userId = user.Id,
                directPermissions,
                rolePermissions,
                effectivePermissions,
                permissions = effectivePermissions
            });
        }

        /// <summary>
        /// Save / replace direct access permissions for a user (by PermissionIds or Permission names)
        /// </summary>
        [HttpPut("{id:int}/permissions")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateUserPermissions(int id, [FromBody] AssignUserPermissionsDto dto)
        {
            var user = await _context.Users
                .Include(u => u.UserPermissions)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return NotFound(new { message = $"User with ID {id} not found." });

            var resolvedPerms = await ResolvePermissionsAsync(dto?.PermissionIds, dto?.Permissions);
            _context.UserPermissions.RemoveRange(user.UserPermissions.ToList());
            foreach (var perm in resolvedPerms)
            {
                _context.UserPermissions.Add(new UserPermission { UserId = user.Id, PermissionId = perm.Id });
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
            await _auditService.LogActionAsync(actorId, actorName, "ASSIGN_PERMISSIONS", "User", user.Id.ToString(), $"Assigned {resolvedPerms.Count} direct permissions to {user.Email}.", ip);

            return Ok(new
            {
                success = true,
                userId = user.Id,
                permissions = resolvedPerms.Select(p => p.Name).ToList(),
                message = "User permissions updated successfully."
            });
        }

        /// <summary>
        /// Assign roles to a user (by RoleIds or Role names)
        /// </summary>
        [HttpPut("{id:int}/roles")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> AssignUserRoles(int id, [FromBody] AssignUserRolesDto dto)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return NotFound(new { message = $"User with ID {id} not found." });

            var roles = new List<Role>();
            if (dto?.RoleIds != null && dto.RoleIds.Count > 0)
            {
                roles.AddRange(await _context.Roles.Where(r => dto.RoleIds.Contains(r.Id)).ToListAsync());
            }
            if (dto?.Roles != null && dto.Roles.Count > 0)
            {
                var names = dto.Roles.Where(n => !string.IsNullOrWhiteSpace(n)).Select(n => n.Trim().ToLower()).ToList();
                var byName = await _context.Roles.Where(r => names.Contains(r.Name.ToLower())).ToListAsync();
                roles.AddRange(byName);
            }

            roles = roles.GroupBy(r => r.Id).Select(g => g.First()).ToList();
            if (roles.Count == 0)
            {
                return BadRequest(new { message = "At least one valid role ID or role name is required." });
            }

            _context.UserRoles.RemoveRange(user.UserRoles.ToList());
            foreach (var role in roles)
            {
                _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
            await _auditService.LogActionAsync(actorId, actorName, "ASSIGN_ROLES", "User", user.Id.ToString(), $"Assigned roles [{string.Join(", ", roles.Select(r => r.Name))}] to {user.Email}.", ip);

            return Ok(new
            {
                success = true,
                userId = user.Id,
                roles = roles.Select(r => r.Name).ToList(),
                message = "User roles updated successfully."
            });
        }

        /// <summary>
        /// View login history for a specific user
        /// </summary>
        [HttpGet("{id:int}/login-history")]
        [ProducesResponseType(typeof(PaginatedResultDto<LoginHistoryResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetUserLoginHistory(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 15)
        {
            if (!await _context.Users.AnyAsync(u => u.Id == id))
            {
                return NotFound(new { message = $"User with ID {id} not found." });
            }

            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _context.LoginHistories
                .AsNoTracking()
                .Where(l => l.UserId == id);

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(l => l.LoginAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
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

            return Ok(new PaginatedResultDto<LoginHistoryResponseDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            });
        }

        /// <summary>
        /// Upload or update a user's profile photo (accepts multipart/form-data file or JSON base64 data URI)
        /// </summary>
        [HttpPost("{id:int}/photo")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UploadUserPhoto(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = $"User with ID {id} not found." });

            string? photoData = null;

            if (Request.HasFormContentType && Request.Form.Files.Count > 0)
            {
                var file = Request.Form.Files[0];
                if (file.Length == 0 || file.Length > 5 * 1024 * 1024)
                {
                    return BadRequest(new { message = "Photo file must be non-empty and under 5 MB." });
                }

                using var ms = new MemoryStream();
                await file.CopyToAsync(ms);
                var base64 = Convert.ToBase64String(ms.ToArray());
                var contentType = string.IsNullOrWhiteSpace(file.ContentType) ? "image/png" : file.ContentType;
                photoData = $"data:{contentType};base64,{base64}";
            }
            else
            {
                var body = await Request.ReadFromJsonAsync<UploadUserPhotoDto>();
                photoData = !string.IsNullOrWhiteSpace(body?.ProfilePhoto) ? body.ProfilePhoto : body?.Base64Image;
            }

            if (string.IsNullOrWhiteSpace(photoData))
            {
                return BadRequest(new { message = "Please upload an image file or provide a base64 profilePhoto value." });
            }

            user.ProfilePhoto = photoData;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
            await _auditService.LogActionAsync(actorId, actorName, "UPDATE_PHOTO", "User", user.Id.ToString(), $"Updated profile photo for {user.Email}.", ip);

            return Ok(new { success = true, id = user.Id, profilePhoto = user.ProfilePhoto, message = "Profile photo updated successfully." });
        }

        /// <summary>
        /// Remove a user's profile photo
        /// </summary>
        [HttpDelete("{id:int}/photo")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteUserPhoto(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = $"User with ID {id} not found." });

            user.ProfilePhoto = null;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
            await _auditService.LogActionAsync(actorId, actorName, "DELETE_PHOTO", "User", user.Id.ToString(), $"Removed profile photo for {user.Email}.", ip);

            return Ok(new { success = true, message = "Profile photo removed successfully." });
        }

        private static UserListItemDto MapToUserListItem(User u)
        {
            var roles = u.UserRoles
                .Where(ur => ur.Role != null)
                .Select(ur => ur.Role.Name)
                .Distinct()
                .ToList();

            var directPerms = u.UserPermissions
                .Where(up => up.Permission != null)
                .Select(up => up.Permission.Name);

            var rolePerms = u.UserRoles
                .Where(ur => ur.Role?.RolePermissions != null)
                .SelectMany(ur => ur.Role.RolePermissions)
                .Where(rp => rp.Permission != null)
                .Select(rp => rp.Permission.Name);

            var permissions = directPerms.Concat(rolePerms).Distinct().OrderBy(p => p).ToList();

            return new UserListItemDto
            {
                Id = u.Id,
                UserCode = u.UserCode,
                Name = u.Name,
                Email = u.Email,
                MobileNumber = u.MobileNumber,
                Role = roles.FirstOrDefault() ?? "User",
                Roles = roles,
                Permissions = permissions,
                IsActive = u.IsActive,
                Status = u.IsActive ? "Active" : "Inactive",
                LastLoginAt = u.LastLoginAt,
                LastLogin = u.LastLoginAt.HasValue
                    ? (u.LastLoginAt.Value.Date == DateTime.UtcNow.Date
                        ? $"Today, {u.LastLoginAt.Value:hh:mm tt}"
                        : u.LastLoginAt.Value.ToString("MMM dd, yyyy"))
                    : "Never",
                ProfilePhoto = u.ProfilePhoto
            };
        }

        private async Task<List<Role>> ResolveRolesAsync(int? roleId, string? roleName, List<string>? roleNames)
        {
            var resolved = new List<Role>();

            if (roleId.HasValue && roleId.Value > 0)
            {
                var byId = await _context.Roles.FindAsync(roleId.Value);
                if (byId != null) resolved.Add(byId);
            }

            var requestedNames = new List<string>();
            if (!string.IsNullOrWhiteSpace(roleName)) requestedNames.Add(roleName.Trim());
            if (roleNames != null)
            {
                requestedNames.AddRange(roleNames.Where(r => !string.IsNullOrWhiteSpace(r)).Select(r => r.Trim()));
            }

            if (requestedNames.Count > 0)
            {
                var lowerNames = requestedNames.Select(n => n.ToLower()).Distinct().ToList();
                var matched = await _context.Roles.Where(r => lowerNames.Contains(r.Name.ToLower())).ToListAsync();
                resolved.AddRange(matched);
            }

            return resolved.GroupBy(r => r.Id).Select(g => g.First()).ToList();
        }

        private async Task<List<Permission>> ResolvePermissionsAsync(List<int>? permissionIds, List<string>? permissionNames)
        {
            var resolved = new List<Permission>();

            if (permissionIds != null && permissionIds.Count > 0)
            {
                resolved.AddRange(await _context.Permissions.Where(p => permissionIds.Contains(p.Id)).ToListAsync());
            }

            if (permissionNames != null && permissionNames.Count > 0)
            {
                var lowerNames = permissionNames
                    .Where(n => !string.IsNullOrWhiteSpace(n))
                    .Select(n => n.Trim().ToLower())
                    .Distinct()
                    .ToList();

                if (lowerNames.Count > 0)
                {
                    var matched = await _context.Permissions
                        .Where(p => lowerNames.Contains(p.Name.ToLower()) || lowerNames.Contains(p.Module.ToLower()))
                        .ToListAsync();
                    resolved.AddRange(matched);
                }
            }

            return resolved.GroupBy(p => p.Id).Select(g => g.First()).ToList();
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
    }
}
