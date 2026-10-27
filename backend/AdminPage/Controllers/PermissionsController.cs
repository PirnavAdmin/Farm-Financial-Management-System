using AgriMan.Api.DTOs;
using AgriMan.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AgriMan.Api.Controllers
{
    [ApiController]
    [Route("api/v1/permissions")]
    public class PermissionsController : ControllerBase
    {
        private readonly IRoleService _roleService;

        public PermissionsController(IRoleService roleService)
        {
            _roleService = roleService;
        }

        /// <summary>
        /// Get all system permissions grouped by module
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<PermissionResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllPermissions()
        {
            var permissions = await _roleService.GetAllPermissionsAsync();
            return Ok(permissions);
        }
    }
}
