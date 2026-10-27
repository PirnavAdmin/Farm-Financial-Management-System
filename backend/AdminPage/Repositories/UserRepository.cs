using AgriMan.Api.Data;
using AgriMan.Api.DTOs;
using AgriMan.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AgriMan.Api.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly ApplicationDbContext _context;

        public UserRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetByIdAsync(int id, bool includeDetails = true)
        {
            var query = _context.Users.AsQueryable();

            if (includeDetails)
            {
                query = query
                    .Include(u => u.UserRoles)
                        .ThenInclude(ur => ur.Role)
                            .ThenInclude(r => r.RolePermissions)
                                .ThenInclude(rp => rp.Permission)
                    .Include(u => u.UserPermissions)
                        .ThenInclude(up => up.Permission);
            }

            return await query.FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            var normalized = email.Trim().ToLower();
            return await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                        .ThenInclude(r => r.RolePermissions)
                            .ThenInclude(rp => rp.Permission)
                .Include(u => u.UserPermissions)
                    .ThenInclude(up => up.Permission)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == normalized);
        }

        public async Task<User?> GetByUserCodeAsync(string userCode)
        {
            return await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.UserCode == userCode);
        }

        public async Task<(IEnumerable<User> Users, int TotalCount)> GetPagedAsync(
            string? search, 
            string? role, 
            string? status, 
            int page, 
            int pageSize)
        {
            var query = _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .AsQueryable();

            // Search filter across Name, Email, MobileNumber, UserCode, Role
            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(u => 
                    u.Name.ToLower().Contains(term) ||
                    u.Email.ToLower().Contains(term) ||
                    (u.MobileNumber != null && u.MobileNumber.ToLower().Contains(term)) ||
                    u.UserCode.ToLower().Contains(term) ||
                    u.UserRoles.Any(ur => ur.Role.Name.ToLower().Contains(term)));
            }

            // Role filter
            if (!string.IsNullOrWhiteSpace(role) && !role.Equals("All roles", StringComparison.OrdinalIgnoreCase))
            {
                var roleTerm = role.Trim().ToLower();
                query = query.Where(u => u.UserRoles.Any(ur => ur.Role.Name.ToLower() == roleTerm));
            }

            // Status filter
            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All statuses", StringComparison.OrdinalIgnoreCase))
            {
                bool isActive = status.Equals("Active", StringComparison.OrdinalIgnoreCase);
                query = query.Where(u => u.IsActive == isActive);
            }

            var totalCount = await query.CountAsync();

            var users = await query
                .OrderBy(u => u.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (users, totalCount);
        }

        public async Task<UserStatsResponse> GetStatsAsync()
        {
            // Calculate directly from SQL Server
            var totalUsers = await _context.Users.CountAsync();
            var activeUsers = await _context.Users.CountAsync(u => u.IsActive);
            var inactiveUsers = await _context.Users.CountAsync(u => !u.IsActive);

            return new UserStatsResponse
            {
                TotalUsers = totalUsers,
                ActiveUsers = activeUsers,
                InactiveUsers = inactiveUsers
            };
        }

        public async Task<User> AddAsync(User user)
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task UpdateAsync(User user)
        {
            user.UpdatedAt = DateTime.UtcNow;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> SoftDeleteAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return false;
            }

            user.IsDeleted = true;
            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsByEmailAsync(string email, int? excludeUserId = null)
        {
            var normalized = email.Trim().ToLower();
            return await _context.Users
                .IgnoreQueryFilters()
                .AnyAsync(u => 
                    !u.IsDeleted &&
                    u.Email.ToLower() == normalized && 
                    (!excludeUserId.HasValue || u.Id != excludeUserId.Value));
        }

        public async Task<string> GenerateNextUserCodeAsync()
        {
            var allCodes = await _context.Users
                .IgnoreQueryFilters()
                .Select(u => u.UserCode)
                .ToListAsync();

            int maxId = 0;
            foreach (var code in allCodes)
            {
                if (!string.IsNullOrEmpty(code) && code.StartsWith("USR-", StringComparison.OrdinalIgnoreCase))
                {
                    if (int.TryParse(code.Substring(4), out int parsed) && parsed > maxId)
                    {
                        maxId = parsed;
                    }
                }
            }

            return $"USR-{(maxId + 1):D3}";
        }
    }
}
