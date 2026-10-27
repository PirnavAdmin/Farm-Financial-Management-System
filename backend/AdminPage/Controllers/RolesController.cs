using System.Security.Claims;
using AgriMan.Api.DTOs;
using AgriMan.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AgriMan.Api.Controllers
{
    [ApiController]
    [Route("api/v1/roles")]
    public class RolesController : ControllerBase
    {
        private readonly IRoleService _roleService;
        private readonly ILogger<RolesController> _logger;

        public RolesController(IRoleService roleService, ILogger<RolesController> logger)
        {
            _roleService = roleService;
            _logger = logger;
        }

        /// <summary>
        /// Get all available roles in the system
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<RoleResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _roleService.GetAllRolesAsync();
            return Ok(roles);
        }

        /// <summary>
        /// Get role details by ID
        /// </summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(RoleResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetRoleById(int id)
        {
            var role = await _roleService.GetRoleByIdAsync(id);
            if (role == null)
            {
                return NotFound(new { message = $"Role with ID {id} was not found." });
            }

            return Ok(role);
        }

        /// <summary>
        /// Create a new role
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(RoleResponse), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var (actorId, actorName) = GetCurrentActor();
                var role = await _roleService.CreateRoleAsync(request, actorId, actorName);
                return CreatedAtAction(nameof(GetRoleById), new { id = role.Id }, role);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Update an existing role
        /// </summary>
        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(RoleResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateRoleRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var (actorId, actorName) = GetCurrentActor();
            var role = await _roleService.UpdateRoleAsync(id, request, actorId, actorName);
            if (role == null)
            {
                return NotFound(new { message = $"Role with ID {id} was not found." });
            }

            return Ok(role);
        }

        /// <summary>
        /// Delete a role (only if no users are assigned)
        /// </summary>
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteRole(int id)
        {
            var (actorId, actorName) = GetCurrentActor();
            var success = await _roleService.DeleteRoleAsync(id, actorId, actorName);
            if (!success)
            {
                return BadRequest(new { message = $"Role with ID {id} cannot be deleted because it does not exist or has users assigned to it." });
            }

            return Ok(new { success = true, message = $"Role with ID {id} deleted successfully." });
        }

        /// <summary>
        /// Assign permissions to a role
        /// </summary>
        [HttpPut("{id:int}/permissions")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> AssignPermissions(int id, [FromBody] AssignPermissionsRequest request)
        {
            var (actorId, actorName) = GetCurrentActor();
            var success = await _roleService.AssignPermissionsToRoleAsync(id, request, actorId, actorName);
            if (!success)
            {
                return NotFound(new { message = $"Role with ID {id} was not found." });
            }

            return Ok(new { success = true, message = "Permissions updated for role successfully." });
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
