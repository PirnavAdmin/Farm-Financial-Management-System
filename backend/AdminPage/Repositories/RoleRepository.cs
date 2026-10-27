using AgriMan.Api.Data;
using AgriMan.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AgriMan.Api.Repositories
{
    public class RoleRepository : IRoleRepository
    {
        private readonly ApplicationDbContext _context;

        public RoleRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Role>> GetAllAsync()
        {
            return await _context.Roles
                .Include(r => r.UserRoles)
                .Include(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
                .OrderBy(r => r.Id)
                .ToListAsync();
        }

        public async Task<Role?> GetByIdAsync(int id, bool includePermissions = true)
        {
            var query = _context.Roles.AsQueryable();

            if (includePermissions)
            {
                query = query
                    .Include(r => r.RolePermissions)
                        .ThenInclude(rp => rp.Permission)
                    .Include(r => r.UserRoles);
            }

            return await query.FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<Role?> GetByNameAsync(string name)
        {
            var normalized = name.Trim().ToLower();
            return await _context.Roles
                .Include(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(r => r.Name.ToLower() == normalized);
        }

        public async Task<Role> AddAsync(Role role)
        {
            await _context.Roles.AddAsync(role);
            await _context.SaveChangesAsync();
            return role;
        }

        public async Task UpdateAsync(Role role)
        {
            _context.Roles.Update(role);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var role = await _context.Roles
                .Include(r => r.UserRoles)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null || role.UserRoles.Any())
            {
                return false;
            }

            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Permission>> GetAllPermissionsAsync()
        {
            return await _context.Permissions
                .OrderBy(p => p.Module)
                .ThenBy(p => p.Name)
                .ToListAsync();
        }

        public async Task AssignPermissionsToRoleAsync(int roleId, IEnumerable<int> permissionIds)
        {
            var existing = await _context.RolePermissions
                .Where(rp => rp.RoleId == roleId)
                .ToListAsync();

            _context.RolePermissions.RemoveRange(existing);

            // Filter only valid existing permission IDs to prevent foreign key errors (e.g. if user passes 0)
            var validPermissionIds = await _context.Permissions
                .Where(p => permissionIds.Contains(p.Id))
                .Select(p => p.Id)
                .ToListAsync();

            if (validPermissionIds.Any())
            {
                var toAdd = validPermissionIds.Select(pid => new RolePermission
                {
                    RoleId = roleId,
                    PermissionId = pid
                });

                await _context.RolePermissions.AddRangeAsync(toAdd);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<int> GetUserCountForRoleAsync(int roleId)
        {
            return await _context.UserRoles.CountAsync(ur => ur.RoleId == roleId);
        }
    }
}
