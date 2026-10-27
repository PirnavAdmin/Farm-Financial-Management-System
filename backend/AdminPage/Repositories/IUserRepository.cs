using AgriMan.Api.DTOs;
using AgriMan.Api.Models;

namespace AgriMan.Api.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetByIdAsync(int id, bool includeDetails = true);
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByUserCodeAsync(string userCode);
        Task<(IEnumerable<User> Users, int TotalCount)> GetPagedAsync(
            string? search, 
            string? role, 
            string? status, 
            int page, 
            int pageSize);
        Task<UserStatsResponse> GetStatsAsync();
        Task<User> AddAsync(User user);
        Task UpdateAsync(User user);
        Task<bool> SoftDeleteAsync(int id);
        Task<bool> ExistsByEmailAsync(string email, int? excludeUserId = null);
        Task<string> GenerateNextUserCodeAsync();
    }
}
