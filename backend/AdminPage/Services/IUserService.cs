using AgriMan.Api.DTOs;

namespace AgriMan.Api.Services
{
    public interface IUserService
    {
        Task<PaginatedResponse<UserResponse>> GetUsersAsync(
            string? search, 
            string? role, 
            string? status, 
            int page, 
            int pageSize);

        Task<UserResponse?> GetUserByIdAsync(int id);
        Task<UserResponse> CreateUserAsync(CreateUserRequest request, int? actorUserId = null, string? actorName = null);
        Task<UserResponse?> UpdateUserAsync(int id, UpdateUserRequest request, int? actorUserId = null, string? actorName = null);
        Task<bool> UpdateUserStatusAsync(int id, bool isActive, int? actorUserId = null, string? actorName = null);
        Task<bool> DeleteUserAsync(int id, int? actorUserId = null, string? actorName = null);
        Task<UserStatsResponse> GetUserStatsAsync();
        Task<IEnumerable<string>> GetUserPermissionsAsync(int id);
        Task<IEnumerable<string>> UpdateUserPermissionsAsync(int id, List<string> permissions, int? actorUserId = null, string? actorName = null);
        Task<string?> UpdateUserPhotoAsync(int id, string photoDataOrUrl, int? actorUserId = null, string? actorName = null);
        Task<bool> DeleteUserPhotoAsync(int id, int? actorUserId = null, string? actorName = null);
        Task<bool> AssignRolesToUserAsync(int id, List<string> roles, int? actorUserId = null, string? actorName = null);
        Task<PaginatedResponse<LoginHistoryResponse>> GetUserLoginHistoryAsync(int id, int page, int pageSize);
    }
}
