using AgriMan.Api.DTOs;
using AgriMan.Api.Models;
using AgriMan.Api.Repositories;

namespace AgriMan.Api.Services
{
    public class RoleService : IRoleService
    {
        private readonly IRoleRepository _roleRepo;
        private readonly IAuditService _auditService;

        public RoleService(IRoleRepository roleRepo, IAuditService auditService)
        {
            _roleRepo = roleRepo;
            _auditService = auditService;
        }

        public async Task<IEnumerable<RoleResponse>> GetAllRolesAsync()
        {
            var roles = await _roleRepo.GetAllAsync();
            var responses = new List<RoleResponse>();

            foreach (var role in roles)
            {
                responses.Add(new RoleResponse
                {
                    Id = role.Id,
                    Name = role.Name,
                    Description = role.Description,
                    UserCount = role.UserRoles.Count,
                    Permissions = role.RolePermissions.Select(rp => rp.Permission.Name).ToList(),
                    CreatedAt = role.CreatedAt
                });
            }

            return responses;
        }

        public async Task<RoleResponse?> GetRoleByIdAsync(int id)
        {
            var role = await _roleRepo.GetByIdAsync(id, includePermissions: true);
            if (role == null) return null;

            return new RoleResponse
            {
                Id = role.Id,
                Name = role.Name,
                Description = role.Description,
                UserCount = role.UserRoles.Count,
                Permissions = role.RolePermissions.Select(rp => rp.Permission.Name).ToList(),
                CreatedAt = role.CreatedAt
            };
        }

        public async Task<RoleResponse> CreateRoleAsync(CreateRoleRequest request, int? actorUserId = null, string? actorName = null)
        {
            var existing = await _roleRepo.GetByNameAsync(request.Name);
            if (existing != null)
            {
                throw new InvalidOperationException($"Role '{request.Name}' already exists.");
            }

            var role = new Role
            {
                Name = request.Name.Trim(),
                Description = request.Description?.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            await _roleRepo.AddAsync(role);

            if (request.PermissionIds != null && request.PermissionIds.Any())
            {
                await _roleRepo.AssignPermissionsToRoleAsync(role.Id, request.PermissionIds);
            }

            await _auditService.LogActionAsync(
                action: "CREATE",
                entityType: "Role",
                entityId: role.Id.ToString(),
                details: $"Role '{role.Name}' created.",
                actorUserId: actorUserId,
                actorName: actorName
            );

            return (await GetRoleByIdAsync(role.Id))!;
        }

        public async Task<RoleResponse?> UpdateRoleAsync(int id, UpdateRoleRequest request, int? actorUserId = null, string? actorName = null)
        {
            var role = await _roleRepo.GetByIdAsync(id, includePermissions: false);
            if (role == null) return null;

            role.Name = request.Name.Trim();
            role.Description = request.Description?.Trim();

            await _roleRepo.UpdateAsync(role);

            await _auditService.LogActionAsync(
                action: "UPDATE",
                entityType: "Role",
                entityId: id.ToString(),
                details: $"Role '{role.Name}' updated.",
                actorUserId: actorUserId,
                actorName: actorName
            );

            return await GetRoleByIdAsync(id);
        }

        public async Task<bool> DeleteRoleAsync(int id, int? actorUserId = null, string? actorName = null)
        {
            var role = await _roleRepo.GetByIdAsync(id, includePermissions: false);
            if (role == null) return false;

            var deleted = await _roleRepo.DeleteAsync(id);
            if (deleted)
            {
                await _auditService.LogActionAsync(
                    action: "DELETE",
                    entityType: "Role",
                    entityId: id.ToString(),
                    details: $"Role '{role.Name}' deleted.",
                    actorUserId: actorUserId,
                    actorName: actorName
                );
            }

            return deleted;
        }

        public async Task<IEnumerable<PermissionResponse>> GetAllPermissionsAsync()
        {
            var perms = await _roleRepo.GetAllPermissionsAsync();
            return perms.Select(p => new PermissionResponse
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Module = p.Module
            });
        }

        public async Task<bool> AssignPermissionsToRoleAsync(int roleId, AssignPermissionsRequest request, int? actorUserId = null, string? actorName = null)
        {
            var role = await _roleRepo.GetByIdAsync(roleId, includePermissions: false);
            if (role == null) return false;

            await _roleRepo.AssignPermissionsToRoleAsync(roleId, request.PermissionIds);

            await _auditService.LogActionAsync(
                action: "ASSIGN_PERMISSIONS",
                entityType: "Role",
                entityId: roleId.ToString(),
                details: $"Permissions updated for role '{role.Name}'.",
                actorUserId: actorUserId,
                actorName: actorName
            );

            return true;
        }
    }
}
