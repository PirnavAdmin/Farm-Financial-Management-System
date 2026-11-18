using AgriMan.Api.Data;
using AgriMan.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgriMan.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/v1/[controller]")]
    [Produces("application/json")]
    public class RolesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RolesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.Roles
                .Select(r => new
                {
                    r.Id,
                    r.Name,
                    r.Description,
                    UserCount = r.UserRoles.Count
                })
                .ToListAsync();

            return Ok(roles);
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Route("api/v1/[controller]")]
    [Produces("application/json")]
    public class PermissionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PermissionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetPermissions()
        {
            var perms = await _context.Permissions
                .OrderBy(p => p.Module)
                .ThenBy(p => p.Name)
                .ToListAsync();

            return Ok(perms);
        }
    }
}


