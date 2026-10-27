using AgriMan.Api.Models;

namespace AgriMan.Api.Repositories
{
    public interface IRoleRepository
    {
        Task<IEnumerable<Role>> GetAllAsync();
        Task<Role?> GetByIdAsync(int id, bool includePermissions = true);
        Task<Role?> GetByNameAsync(string name);
        Task<Role> AddAsync(Role role);
        Task UpdateAsync(Role role);
        Task<bool> DeleteAsync(int id);
        Task<IEnumerable<Permission>> GetAllPermissionsAsync();
        Task AssignPermissionsToRoleAsync(int roleId, IEnumerable<int> permissionIds);
        Task<int> GetUserCountForRoleAsync(int roleId);
    }
}
