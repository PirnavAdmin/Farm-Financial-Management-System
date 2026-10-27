using AgriMan.Api.DTOs;

namespace AgriMan.Api.Services
{
    public interface IRoleService
    {
        Task<IEnumerable<RoleResponse>> GetAllRolesAsync();
        Task<RoleResponse?> GetRoleByIdAsync(int id);
        Task<RoleResponse> CreateRoleAsync(CreateRoleRequest request, int? actorUserId = null, string? actorName = null);
        Task<RoleResponse?> UpdateRoleAsync(int id, UpdateRoleRequest request, int? actorUserId = null, string? actorName = null);
        Task<bool> DeleteRoleAsync(int id, int? actorUserId = null, string? actorName = null);
        Task<IEnumerable<PermissionResponse>> GetAllPermissionsAsync();
        Task<bool> AssignPermissionsToRoleAsync(int roleId, AssignPermissionsRequest request, int? actorUserId = null, string? actorName = null);
    }
}
