using AgriMan.Api.Data;
using AgriMan.Api.DTOs;
using AgriMan.Api.Models;
using AgriMan.Api.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AgriMan.Api.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepo;
        private readonly IRoleRepository _roleRepo;
        private readonly ApplicationDbContext _context;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IAuditService _auditService;

        public UserService(
            IUserRepository userRepo,
            IRoleRepository roleRepo,
            ApplicationDbContext context,
            IPasswordHasher passwordHasher,
            IAuditService auditService)
        {
            _userRepo = userRepo;
            _roleRepo = roleRepo;
            _context = context;
            _passwordHasher = passwordHasher;
            _auditService = auditService;
        }

        public async Task<PaginatedResponse<UserResponse>> GetUsersAsync(
            string? search, 
            string? role, 
            string? status, 
            int page, 
            int pageSize)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;

            var (users, totalCount) = await _userRepo.GetPagedAsync(search, role, status, page, pageSize);

            var items = users.Select(MapToResponse).ToList();

            return new PaginatedResponse<UserResponse>(items, totalCount, page, pageSize);
        }

        public async Task<UserResponse?> GetUserByIdAsync(int id)
        {
            var user = await _userRepo.GetByIdAsync(id, includeDetails: true);
            return user == null ? null : MapToResponse(user);
        }

        public async Task<UserResponse> CreateUserAsync(
            CreateUserRequest request, 
            int? actorUserId = null, 
            string? actorName = null)
        {
            var normalizedEmail = request.Email.Trim().ToLower();
            var rawPassword = string.IsNullOrWhiteSpace(request.Password) ? "AgriMan@2026" : request.Password;

            var roleNames = request.Roles != null && request.Roles.Any() 
                ? request.Roles 
                : new List<string> { "Farmer" };

            // Check if user already exists (including soft-deleted)
            var existingUser = await _context.Users
                .IgnoreQueryFilters()
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

            if (existingUser != null)
            {
                if (!existingUser.IsDeleted)
                {
                    throw new InvalidOperationException($"A user with email '{request.Email}' already exists.");
                }

                // Restore previously soft-deleted user
                existingUser.IsDeleted = false;
                existingUser.IsActive = request.IsActive;
                existingUser.Name = request.Name.Trim();
                existingUser.MobileNumber = string.IsNullOrWhiteSpace(request.MobileNumber) ? existingUser.MobileNumber : request.MobileNumber.Trim();
                existingUser.PasswordHash = _passwordHasher.HashPassword(rawPassword);
                existingUser.ProfilePhoto = request.ProfilePhoto ?? request.Photo ?? existingUser.ProfilePhoto;
                existingUser.UpdatedAt = DateTime.UtcNow;

                existingUser.UserRoles.Clear();
                foreach (var roleName in roleNames.Distinct(StringComparer.OrdinalIgnoreCase))
                {
                    var role = await _roleRepo.GetByNameAsync(roleName);
                    if (role == null)
                    {
                        role = new Role
                        {
                            Name = roleName.Trim(),
                            Description = $"{roleName} role in AgriMan system"
                        };
                        await _roleRepo.AddAsync(role);
                    }

                    existingUser.UserRoles.Add(new UserRole
                    {
                        RoleId = role.Id,
                        UserId = existingUser.Id
                    });
                }

                await _context.SaveChangesAsync();

                await _auditService.LogActionAsync(
                    action: "REACTIVATE_CREATE",
                    entityType: "User",
                    entityId: existingUser.Id.ToString(),
                    details: $"Reactivated user '{existingUser.Name}' ({existingUser.UserCode}, {existingUser.Email}) with roles: {string.Join(", ", roleNames)}.",
                    actorUserId: actorUserId,
                    actorName: actorName
                );

                return (await GetUserByIdAsync(existingUser.Id))!;
            }

            var userCode = await _userRepo.GenerateNextUserCodeAsync();

            var user = new User
            {
                UserCode = userCode,
                Name = request.Name.Trim(),
                Email = normalizedEmail,
                MobileNumber = string.IsNullOrWhiteSpace(request.MobileNumber) ? null : request.MobileNumber.Trim(),
                PasswordHash = _passwordHasher.HashPassword(rawPassword),
                IsActive = request.IsActive,
                ProfilePhoto = request.ProfilePhoto ?? request.Photo,
                CreatedAt = DateTime.UtcNow
            };

            foreach (var roleName in roleNames.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var role = await _roleRepo.GetByNameAsync(roleName);
                if (role == null)
                {
                    // Create role if it doesn't exist
                    role = new Role
                    {
                        Name = roleName.Trim(),
                        Description = $"{roleName} role in AgriMan system"
                    };
                    await _roleRepo.AddAsync(role);
                }

                user.UserRoles.Add(new UserRole
                {
                    Role = role,
                    RoleId = role.Id
                });
            }

            await _userRepo.AddAsync(user);

            // Assign direct permissions if specified
            if (request.Permissions != null && request.Permissions.Any())
            {
                foreach (var permName in request.Permissions.Distinct(StringComparer.OrdinalIgnoreCase))
                {
                    var perm = await _context.Permissions.FirstOrDefaultAsync(p => p.Name.ToLower() == permName.Trim().ToLower());
                    if (perm == null)
                    {
                        perm = new Permission { Name = permName.Trim(), Description = $"{permName} module access", Module = "General" };
                        await _context.Permissions.AddAsync(perm);
                        await _context.SaveChangesAsync();
                    }

                    _context.UserPermissions.Add(new UserPermission
                    {
                        UserId = user.Id,
                        PermissionId = perm.Id
                    });
                }
                await _context.SaveChangesAsync();
            }

            await _auditService.LogActionAsync(
                action: "CREATE",
                entityType: "User",
                entityId: user.Id.ToString(),
                details: $"Created user '{user.Name}' ({user.UserCode}, {user.Email}) with roles: {string.Join(", ", roleNames)}.",
                actorUserId: actorUserId,
                actorName: actorName
            );

            return (await GetUserByIdAsync(user.Id))!;
        }

        public async Task<UserResponse?> UpdateUserAsync(
            int id, 
            UpdateUserRequest request, 
            int? actorUserId = null, 
            string? actorName = null)
        {
            var user = await _userRepo.GetByIdAsync(id, includeDetails: true);
            if (user == null) return null;

            var normalizedEmail = request.Email.Trim().ToLower();
            if (await _userRepo.ExistsByEmailAsync(normalizedEmail, excludeUserId: id))
            {
                throw new InvalidOperationException($"Email '{request.Email}' is already registered to another user.");
            }

            user.Name = request.Name.Trim();
            user.Email = normalizedEmail;
            user.MobileNumber = string.IsNullOrWhiteSpace(request.MobileNumber) ? null : request.MobileNumber.Trim();

            if (!string.IsNullOrEmpty(request.ProfilePhoto) || !string.IsNullOrEmpty(request.Photo))
            {
                user.ProfilePhoto = request.ProfilePhoto ?? request.Photo;
            }

            if (request.IsActive.HasValue)
            {
                user.IsActive = request.IsActive.Value;
            }

            // Update direct permissions if provided
            if (request.Permissions != null)
            {
                var existingUserPerms = await _context.UserPermissions.Where(up => up.UserId == id).ToListAsync();
                _context.UserPermissions.RemoveRange(existingUserPerms);

                foreach (var permName in request.Permissions.Distinct(StringComparer.OrdinalIgnoreCase))
                {
                    var perm = await _context.Permissions.FirstOrDefaultAsync(p => p.Name.ToLower() == permName.Trim().ToLower());
                    if (perm == null)
                    {
                        perm = new Permission { Name = permName.Trim(), Description = $"{permName} module access", Module = "General" };
                        await _context.Permissions.AddAsync(perm);
                        await _context.SaveChangesAsync();
                    }

                    _context.UserPermissions.Add(new UserPermission
                    {
                        UserId = id,
                        PermissionId = perm.Id
                    });
                }
            }

            // Update roles if provided
            if (request.Roles != null)
            {
                // Remove existing roles
                var existingUserRoles = await _context.UserRoles.Where(ur => ur.UserId == id).ToListAsync();
                _context.UserRoles.RemoveRange(existingUserRoles);

                var targetRoles = request.Roles.Any() ? request.Roles : new List<string> { "Farmer" };
                foreach (var roleName in targetRoles.Distinct(StringComparer.OrdinalIgnoreCase))
                {
                    var role = await _roleRepo.GetByNameAsync(roleName);
                    if (role == null)
                    {
                        role = new Role { Name = roleName.Trim(), Description = $"{roleName} role" };
                        await _roleRepo.AddAsync(role);
                    }

                    _context.UserRoles.Add(new UserRole
                    {
                        UserId = user.Id,
                        RoleId = role.Id
                    });
                }
            }

            await _userRepo.UpdateAsync(user);

            await _auditService.LogActionAsync(
                action: "UPDATE",
                entityType: "User",
                entityId: id.ToString(),
                details: $"Updated user profile for '{user.Name}' ({user.UserCode}).",
                actorUserId: actorUserId,
                actorName: actorName
            );

            return await GetUserByIdAsync(id);
        }

        public async Task<bool> UpdateUserStatusAsync(
            int id, 
            bool isActive, 
            int? actorUserId = null, 
            string? actorName = null)
        {
            var user = await _userRepo.GetByIdAsync(id, includeDetails: false);
            if (user == null) return false;

            user.IsActive = isActive;
            await _userRepo.UpdateAsync(user);

            var actionName = isActive ? "ACTIVATE" : "DEACTIVATE";
            await _auditService.LogActionAsync(
                action: actionName,
                entityType: "User",
                entityId: id.ToString(),
                details: $"User '{user.Name}' ({user.UserCode}) status changed to {(isActive ? "Active" : "Inactive")}.",
                actorUserId: actorUserId,
                actorName: actorName
            );

            return true;
        }

        public async Task<bool> DeleteUserAsync(int id, int? actorUserId = null, string? actorName = null)
        {
            var user = await _userRepo.GetByIdAsync(id, includeDetails: false);
            if (user == null) return false;

            var success = await _userRepo.SoftDeleteAsync(id);
            if (success)
            {
                await _auditService.LogActionAsync(
                    action: "SOFT_DELETE",
                    entityType: "User",
                    entityId: id.ToString(),
                    details: $"User '{user.Name}' ({user.UserCode}) was soft-deleted.",
                    actorUserId: actorUserId,
                    actorName: actorName
                );
            }

            return success;
        }

        public async Task<UserStatsResponse> GetUserStatsAsync()
        {
            return await _userRepo.GetStatsAsync();
        }

        public async Task<IEnumerable<string>> GetUserPermissionsAsync(int id)
        {
            var user = await _userRepo.GetByIdAsync(id, includeDetails: true);
            if (user == null) return Enumerable.Empty<string>();

            var rolePermissions = user.UserRoles
                .SelectMany(ur => ur.Role.RolePermissions)
                .Select(rp => rp.Permission.Name);

            var directPermissions = user.UserPermissions
                .Select(up => up.Permission.Name);

            return rolePermissions.Concat(directPermissions).Distinct().OrderBy(p => p);
        }

        public async Task<IEnumerable<string>> UpdateUserPermissionsAsync(
            int id, 
            List<string> permissions, 
            int? actorUserId = null, 
            string? actorName = null)
        {
            var user = await _userRepo.GetByIdAsync(id, includeDetails: true);
            if (user == null) throw new InvalidOperationException($"User with ID {id} was not found.");

            var existingUserPerms = await _context.UserPermissions.Where(up => up.UserId == id).ToListAsync();
            _context.UserPermissions.RemoveRange(existingUserPerms);

            var targetPermissions = permissions ?? new List<string>();
            foreach (var permName in targetPermissions.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var perm = await _context.Permissions.FirstOrDefaultAsync(p => p.Name.ToLower() == permName.Trim().ToLower());
                if (perm == null)
                {
                    perm = new Permission { Name = permName.Trim(), Description = $"{permName} module access", Module = "General" };
                    await _context.Permissions.AddAsync(perm);
                    await _context.SaveChangesAsync();
                }

                _context.UserPermissions.Add(new UserPermission
                {
                    UserId = id,
                    PermissionId = perm.Id
                });
            }

            await _context.SaveChangesAsync();

            await _auditService.LogActionAsync(
                action: "UPDATE_PERMISSIONS",
                entityType: "User",
                entityId: id.ToString(),
                details: $"Updated permissions for user '{user.Name}' ({user.UserCode}): {string.Join(", ", targetPermissions)}.",
                actorUserId: actorUserId,
                actorName: actorName
            );

            return await GetUserPermissionsAsync(id);
        }

        public async Task<string?> UpdateUserPhotoAsync(
            int id, 
            string photoDataOrUrl, 
            int? actorUserId = null, 
            string? actorName = null)
        {
            var user = await _userRepo.GetByIdAsync(id, includeDetails: false);
            if (user == null) return null;

            user.ProfilePhoto = photoDataOrUrl;
            await _userRepo.UpdateAsync(user);

            await _auditService.LogActionAsync(
                action: "UPDATE_PHOTO",
                entityType: "User",
                entityId: id.ToString(),
                details: $"Updated profile photo for user '{user.Name}' ({user.UserCode}).",
                actorUserId: actorUserId,
                actorName: actorName
            );

            return user.ProfilePhoto;
        }

        public async Task<bool> DeleteUserPhotoAsync(
            int id, 
            int? actorUserId = null, 
            string? actorName = null)
        {
            var user = await _userRepo.GetByIdAsync(id, includeDetails: false);
            if (user == null) return false;

            user.ProfilePhoto = null;
            await _userRepo.UpdateAsync(user);

            await _auditService.LogActionAsync(
                action: "DELETE_PHOTO",
                entityType: "User",
                entityId: id.ToString(),
                details: $"Removed profile photo for user '{user.Name}' ({user.UserCode}).",
                actorUserId: actorUserId,
                actorName: actorName
            );

            return true;
        }

        public async Task<bool> AssignRolesToUserAsync(
            int id, 
            List<string> roles, 
            int? actorUserId = null, 
            string? actorName = null)
        {
            var user = await _userRepo.GetByIdAsync(id, includeDetails: true);
            if (user == null) return false;

            var existingUserRoles = await _context.UserRoles.Where(ur => ur.UserId == id).ToListAsync();
            _context.UserRoles.RemoveRange(existingUserRoles);

            foreach (var roleName in roles.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var role = await _roleRepo.GetByNameAsync(roleName);
                if (role == null)
                {
                    role = new Role { Name = roleName.Trim(), Description = $"{roleName} role" };
                    await _roleRepo.AddAsync(role);
                }

                _context.UserRoles.Add(new UserRole
                {
                    UserId = user.Id,
                    RoleId = role.Id
                });
            }

            await _context.SaveChangesAsync();

            await _auditService.LogActionAsync(
                action: "ASSIGN_ROLES",
                entityType: "User",
                entityId: id.ToString(),
                details: $"Roles updated for user '{user.Name}' ({user.UserCode}) to: {string.Join(", ", roles)}.",
                actorUserId: actorUserId,
                actorName: actorName
            );

            return true;
        }

        public async Task<PaginatedResponse<LoginHistoryResponse>> GetUserLoginHistoryAsync(
            int id, 
            int page, 
            int pageSize)
        {
            return await _auditService.GetLoginHistoryAsync(id, page, pageSize);
        }

        private static UserResponse MapToResponse(User user)
        {
            var roleNames = user.UserRoles?.Select(ur => ur.Role.Name).ToList() ?? new List<string>();
            var primaryRole = roleNames.FirstOrDefault() ?? "User";

            var rolePermissions = user.UserRoles?
                .SelectMany(ur => ur.Role.RolePermissions)
                .Select(rp => rp.Permission.Name) ?? Enumerable.Empty<string>();

            var directPermissions = user.UserPermissions?
                .Select(up => up.Permission.Name) ?? Enumerable.Empty<string>();

            var allPermissions = rolePermissions.Concat(directPermissions).Distinct().OrderBy(p => p).ToList();

            return new UserResponse
            {
                Id = user.Id,
                UserCode = user.UserCode,
                Name = user.Name,
                Initials = CalculateInitials(user.Name),
                Email = user.Email,
                MobileNumber = user.MobileNumber,
                Roles = roleNames,
                PrimaryRole = primaryRole,
                IsActive = user.IsActive,
                LastLoginAt = user.LastLoginAt,
                LastLoginFormatted = FormatLastLogin(user.LastLoginAt),
                CreatedAt = user.CreatedAt,
                ProfilePhoto = user.ProfilePhoto,
                Permissions = allPermissions
            };
        }

        private static string CalculateInitials(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "U";
            var parts = name.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 1) return parts[0].Substring(0, Math.Min(2, parts[0].Length)).ToUpper();
            return $"{char.ToUpper(parts[0][0])}{char.ToUpper(parts[^1][0])}";
        }

        private static string FormatLastLogin(DateTime? lastLoginAt)
        {
            if (!lastLoginAt.HasValue) return "Never";
            var dt = lastLoginAt.Value;
            var now = DateTime.UtcNow;
            var localTime = dt.ToLocalTime();
            var localNow = now.ToLocalTime();

            if (localTime.Date == localNow.Date)
            {
                return $"Today, {localTime:hh:mm tt}";
            }
            if (localTime.Date == localNow.Date.AddDays(-1))
            {
                return $"Yesterday, {localTime:hh:mm tt}";
            }
            if ((localNow.Date - localTime.Date).TotalDays < 7)
            {
                int days = (int)(localNow.Date - localTime.Date).TotalDays;
                return $"{days} days ago";
            }
            return localTime.ToString("dd MMM, hh:mm tt");
        }
    }
}
