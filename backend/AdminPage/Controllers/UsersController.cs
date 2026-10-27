using System.Security.Claims;
using AgriMan.Api.DTOs;
using AgriMan.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AgriMan.Api.Controllers
{
    [ApiController]
    [Route("api/v1/users")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IRoleService _roleService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(
            IUserService userService, 
            IRoleService roleService,
            ILogger<UsersController> logger)
        {
            _userService = userService;
            _roleService = roleService;
            _logger = logger;
        }

        /// <summary>
        /// List users with pagination, search, role and status filtering
        /// </summary>
        /// <example>GET /api/v1/users?search=Arjun&amp;role=Administrator&amp;status=Active&amp;page=1&amp;pageSize=10</example>
        [HttpGet]
        [ProducesResponseType(typeof(PaginatedResponse<UserResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? search,
            [FromQuery] string? role,
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var result = await _userService.GetUsersAsync(search, role, status, page, pageSize);
            return Ok(result);
        }

        /// <summary>
        /// Get user statistics (total, active, inactive) calculated dynamically from SQL Server
        /// </summary>
        [HttpGet("stats")]
        [ProducesResponseType(typeof(UserStatsResponse), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetUserStats()
        {
            var stats = await _userService.GetUserStatsAsync();
            return Ok(stats);
        }

        /// <summary>
        /// Get user details by ID
        /// </summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetUserById(int id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = $"User with ID {id} was not found." });
            }

            return Ok(user);
        }

        /// <summary>
        /// Add a new user
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(UserResponse), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var (actorId, actorName) = GetCurrentActor();
                var createdUser = await _userService.CreateUserAsync(request, actorId, actorName);
                return CreatedAtAction(nameof(GetUserById), new { id = createdUser.Id }, createdUser);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Update user details
        /// </summary>
        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var (actorId, actorName) = GetCurrentActor();
                var updatedUser = await _userService.UpdateUserAsync(id, request, actorId, actorName);
                if (updatedUser == null)
                {
                    return NotFound(new { message = $"User with ID {id} was not found." });
                }

                return Ok(updatedUser);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Activate or deactivate a user
        /// </summary>
        [HttpPatch("{id:int}/status")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] UpdateUserStatusRequest request)
        {
            var (actorId, actorName) = GetCurrentActor();
            var success = await _userService.UpdateUserStatusAsync(id, request.IsActive, actorId, actorName);
            if (!success)
            {
                return NotFound(new { message = $"User with ID {id} was not found." });
            }

            return Ok(new 
            { 
                success = true, 
                message = $"User status successfully updated to {(request.IsActive ? "Active" : "Inactive")}." 
            });
        }

        /// <summary>
        /// Soft-delete a user
        /// </summary>
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var (actorId, actorName) = GetCurrentActor();
            var success = await _userService.DeleteUserAsync(id, actorId, actorName);
            if (!success)
            {
                return NotFound(new { message = $"User with ID {id} was not found." });
            }

            return Ok(new { success = true, message = $"User with ID {id} has been soft-deleted." });
        }

        /// <summary>
        /// Get permissions assigned to a user (via their roles and direct permissions)
        /// </summary>
        [HttpGet("{id:int}/permissions")]
        [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetUserPermissions(int id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = $"User with ID {id} was not found." });
            }

            var permissions = await _userService.GetUserPermissionsAsync(id);
            return Ok(permissions);
        }

        /// <summary>
        /// Save/update access permissions for an individual user
        /// </summary>
        [HttpPut("{id:int}/permissions")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateUserPermissions(int id, [FromBody] UpdateUserPermissionsRequest request)
        {
            if (request == null || request.Permissions == null)
            {
                return BadRequest(new { message = "Permissions list cannot be null." });
            }

            try
            {
                var (actorId, actorName) = GetCurrentActor();
                var updatedPermissions = await _userService.UpdateUserPermissionsAsync(id, request.Permissions, actorId, actorName);
                return Ok(new
                {
                    success = true,
                    message = "User permissions updated successfully.",
                    permissions = updatedPermissions
                });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Update user profile photo (Base64 data URL or photo URL)
        /// </summary>
        [HttpPost("{id:int}/photo")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateUserPhoto(int id, [FromBody] PhotoUploadRequestDto body)
        {
            if (string.IsNullOrWhiteSpace(body?.Photo))
            {
                return BadRequest(new { message = "Photo data cannot be empty." });
            }

            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = $"User with ID {id} was not found." });
            }

            var (actorId, actorName) = GetCurrentActor();
            await _userService.UpdateUserPhotoAsync(id, body.Photo, actorId, actorName);

            return Ok(new
            {
                success = true,
                message = "Profile photo updated successfully.",
                photo = body.Photo
            });
        }

        /// <summary>
        /// Upload user profile photo file (PNG, JPG, JPEG, WEBP)
        /// </summary>
        [HttpPost("{id:int}/photo/upload")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UploadUserPhotoFile(int id, IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Please select a valid image file to upload." });
            }

            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = $"User with ID {id} was not found." });
            }

            var allowedExts = new[] { ".png", ".jpg", ".jpeg", ".webp" };
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExts.Contains(ext))
            {
                return BadRequest(new { message = "Only PNG, JPG, JPEG, and WEBP image files are allowed." });
            }

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
            Directory.CreateDirectory(uploadsFolder);

            var fileName = $"avatar_user_{id}_{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var photoUrl = $"/uploads/avatars/{fileName}";
            var (actorId, actorName) = GetCurrentActor();
            await _userService.UpdateUserPhotoAsync(id, photoUrl, actorId, actorName);

            return Ok(new
            {
                success = true,
                message = "Profile photo uploaded successfully.",
                photo = photoUrl
            });
        }

        /// <summary>
        /// Delete user profile photo
        /// </summary>
        [HttpDelete("{id:int}/photo")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteUserPhoto(int id)
        {
            var (actorId, actorName) = GetCurrentActor();
            var success = await _userService.DeleteUserPhotoAsync(id, actorId, actorName);
            if (!success)
            {
                return NotFound(new { message = $"User with ID {id} was not found." });
            }

            return Ok(new { success = true, message = "Profile photo deleted successfully." });
        }

        /// <summary>
        /// Assign roles to a user
        /// </summary>
        [HttpPut("{id:int}/roles")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> AssignRoles(int id, [FromBody] AssignRolesRequest request)
        {
            if (request.Roles == null || !request.Roles.Any())
            {
                return BadRequest(new { message = "At least one role must be specified." });
            }

            var (actorId, actorName) = GetCurrentActor();
            var success = await _userService.AssignRolesToUserAsync(id, request.Roles, actorId, actorName);
            if (!success)
            {
                return NotFound(new { message = $"User with ID {id} was not found." });
            }

            return Ok(new { success = true, message = "Roles assigned successfully." });
        }

        /// <summary>
        /// View login history for a specific user
        /// </summary>
        [HttpGet("{id:int}/login-history")]
        [ProducesResponseType(typeof(PaginatedResponse<LoginHistoryResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetUserLoginHistory(
            int id, 
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 10)
        {
            var history = await _userService.GetUserLoginHistoryAsync(id, page, pageSize);
            return Ok(history);
        }

        private (int? actorId, string? actorName) GetCurrentActor()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var nameClaim = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst(ClaimTypes.Email)?.Value;

            int? actorId = int.TryParse(idClaim, out int parsed) ? parsed : null;
            return (actorId, nameClaim ?? "Administrator");
        }
    }
}
