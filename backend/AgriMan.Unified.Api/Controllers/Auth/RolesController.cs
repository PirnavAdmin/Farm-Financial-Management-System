using AgriMan.Api.Data;
using AgriMan.Api.DTOs;
using AgriMan.Api.Models;
using AgriMan.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgriMan.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    [Route("api/v1/[controller]")]
    [Produces("application/json")]
    public class RolesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuditService _auditService;

        public RolesController(ApplicationDbContext context, IAuditService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        /// <summary>
        /// Get all roles with assigned user counts and permissions
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(List<RoleResponseDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.Roles
                .AsNoTracking()
                .Include(r => r.UserRoles)
                .Include(r => r.RolePermissions).ThenInclude(rp => rp.Permission)
                .OrderBy(r => r.Id)
                .Select(r => new RoleResponseDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    Description = r.Description,
                    UserCount = r.UserRoles.Count,
                    CreatedAt = r.CreatedAt,
                    Permissions = r.RolePermissions.Select(rp => rp.Permission.Name).OrderBy(p => p).ToList()
                })
                .ToListAsync();

            return Ok(roles);
        }

        /// <summary>
        /// Get role details by ID including assigned permissions
        /// </summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(RoleResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetRoleById(int id)
        {
            var role = await _context.Roles
                .AsNoTracking()
                .Include(r => r.UserRoles)
                .Include(r => r.RolePermissions).ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null) return NotFound(new { message = $"Role with ID {id} was not found." });

            return Ok(new RoleResponseDto
            {
                Id = role.Id,
                Name = role.Name,
                Description = role.Description,
                UserCount = role.UserRoles.Count,
                CreatedAt = role.CreatedAt,
                Permissions = role.RolePermissions.Select(rp => rp.Permission.Name).OrderBy(p => p).ToList()
            });
        }

        /// <summary>
        /// Create a new role (with optional initial permissions)
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(RoleResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var normalizedName = dto.Name.Trim().ToLower();
            if (await _context.Roles.AnyAsync(r => r.Name.ToLower() == normalizedName))
            {
                return BadRequest(new { message = $"Role '{dto.Name}' already exists." });
            }

            var role = new Role
            {
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Roles.Add(role);
            await _context.SaveChangesAsync();

            var permissions = await ResolvePermissionsAsync(dto.PermissionIds, dto.Permissions);
            foreach (var perm in permissions)
            {
                _context.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = perm.Id });
            }
            if (permissions.Count > 0)
            {
                await _context.SaveChangesAsync();
            }

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
            await _auditService.LogActionAsync(actorId, actorName, "CREATE", "Role", role.Id.ToString(), $"Created role '{role.Name}' with {permissions.Count} permissions.", ip);

            return CreatedAtAction(nameof(GetRoleById), new { id = role.Id }, new RoleResponseDto
            {
                Id = role.Id,
                Name = role.Name,
                Description = role.Description,
                UserCount = 0,
                CreatedAt = role.CreatedAt,
                Permissions = permissions.Select(p => p.Name).OrderBy(p => p).ToList()
            });
        }

        /// <summary>
        /// Update an existing role's name, description, and optionally its permissions
        /// </summary>
        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(RoleResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateRoleDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var role = await _context.Roles
                .Include(r => r.UserRoles)
                .Include(r => r.RolePermissions)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null) return NotFound(new { message = $"Role with ID {id} was not found." });

            if (!string.IsNullOrWhiteSpace(dto.Name))
            {
                var normalized = dto.Name.Trim().ToLower();
                if (await _context.Roles.AnyAsync(r => r.Id != id && r.Name.ToLower() == normalized))
                {
                    return BadRequest(new { message = $"Another role named '{dto.Name}' already exists." });
                }
                role.Name = dto.Name.Trim();
            }

            if (dto.Description != null)
            {
                role.Description = dto.Description.Trim();
            }

            if (dto.PermissionIds != null || dto.Permissions != null)
            {
                var resolvedPerms = await ResolvePermissionsAsync(dto.PermissionIds, dto.Permissions);
                _context.RolePermissions.RemoveRange(role.RolePermissions.ToList());
                foreach (var perm in resolvedPerms)
                {
                    _context.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = perm.Id });
                }
            }

            await _context.SaveChangesAsync();

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
            await _auditService.LogActionAsync(actorId, actorName, "UPDATE", "Role", role.Id.ToString(), $"Updated role '{role.Name}'.", ip);

            var updatedPerms = await _context.RolePermissions
                .Where(rp => rp.RoleId == role.Id)
                .Select(rp => rp.Permission.Name)
                .OrderBy(p => p)
                .ToListAsync();

            return Ok(new RoleResponseDto
            {
                Id = role.Id,
                Name = role.Name,
                Description = role.Description,
                UserCount = role.UserRoles.Count,
                CreatedAt = role.CreatedAt,
                Permissions = updatedPerms
            });
        }

        /// <summary>
        /// Delete a role (blocked if users are currently assigned to it)
        /// </summary>
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteRole(int id)
        {
            var role = await _context.Roles
                .Include(r => r.UserRoles)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null) return NotFound(new { message = $"Role with ID {id} was not found." });

            if (role.UserRoles.Count > 0)
            {
                return BadRequest(new { message = $"Role '{role.Name}' cannot be deleted while {role.UserRoles.Count} user(s) are assigned to it." });
            }

            var roleName = role.Name;
            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
            await _auditService.LogActionAsync(actorId, actorName, "DELETE", "Role", id.ToString(), $"Deleted role '{roleName}'.", ip);

            return Ok(new { success = true, message = $"Role '{roleName}' deleted successfully." });
        }

        /// <summary>
        /// Assign or replace permissions for a role (by PermissionIds or Permission names)
        /// </summary>
        [HttpPut("{id:int}/permissions")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> AssignRolePermissions(int id, [FromBody] AssignRolePermissionsDto dto)
        {
            var role = await _context.Roles
                .Include(r => r.RolePermissions)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null) return NotFound(new { message = $"Role with ID {id} was not found." });

            var resolvedPerms = await ResolvePermissionsAsync(dto?.PermissionIds, dto?.Permissions);
            _context.RolePermissions.RemoveRange(role.RolePermissions.ToList());
            foreach (var perm in resolvedPerms)
            {
                _context.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = perm.Id });
            }

            await _context.SaveChangesAsync();

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
            await _auditService.LogActionAsync(actorId, actorName, "ASSIGN_PERMISSIONS", "Role", role.Id.ToString(), $"Assigned {resolvedPerms.Count} permissions to role '{role.Name}'.", ip);

            return Ok(new
            {
                success = true,
                roleId = role.Id,
                roleName = role.Name,
                permissions = resolvedPerms.Select(p => p.Name).OrderBy(p => p).ToList(),
                message = "Permissions updated for role successfully."
            });
        }

        private async Task<List<Permission>> ResolvePermissionsAsync(List<int>? permissionIds, List<string>? permissionNames)
        {
            var resolved = new List<Permission>();

            if (permissionIds != null && permissionIds.Count > 0)
            {
                resolved.AddRange(await _context.Permissions.Where(p => permissionIds.Contains(p.Id)).ToListAsync());
            }

            if (permissionNames != null && permissionNames.Count > 0)
            {
                var lowerNames = permissionNames
                    .Where(n => !string.IsNullOrWhiteSpace(n))
                    .Select(n => n.Trim().ToLower())
                    .Distinct()
                    .ToList();

                if (lowerNames.Count > 0)
                {
                    var matched = await _context.Permissions
                        .Where(p => lowerNames.Contains(p.Name.ToLower()) || lowerNames.Contains(p.Module.ToLower()))
                        .ToListAsync();
                    resolved.AddRange(matched);
                }
            }

            return resolved.GroupBy(p => p.Id).Select(g => g.First()).ToList();
        }
    }

    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    [Route("api/v1/[controller]")]
    [Produces("application/json")]
    public class PermissionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuditService _auditService;

        public PermissionsController(ApplicationDbContext context, IAuditService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        /// <summary>
        /// Get all system permissions (pass grouped=true to group by module)
        /// </summary>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetPermissions([FromQuery] bool grouped = false)
        {
            var perms = await _context.Permissions
                .AsNoTracking()
                .OrderBy(p => p.Module)
                .ThenBy(p => p.Name)
                .Select(p => new PermissionResponseDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Module = p.Module
                })
                .ToListAsync();

            if (grouped)
            {
                var byModule = perms
                    .GroupBy(p => p.Module)
                    .Select(g => new
                    {
                        module = g.Key,
                        permissions = g.ToList()
                    })
                    .ToList();
                return Ok(byModule);
            }

            return Ok(perms);
        }

        /// <summary>
        /// Create a new custom permission
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(PermissionResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreatePermission([FromBody] CreatePermissionDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var normalized = dto.Name.Trim().ToLower();
            if (await _context.Permissions.AnyAsync(p => p.Name.ToLower() == normalized))
            {
                return BadRequest(new { message = $"Permission '{dto.Name}' already exists." });
            }

            var perm = new Permission
            {
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                Module = dto.Module.Trim()
            };

            _context.Permissions.Add(perm);
            await _context.SaveChangesAsync();

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
            await _auditService.LogActionAsync(actorId, actorName, "CREATE", "Permission", perm.Id.ToString(), $"Created permission '{perm.Name}' in module '{perm.Module}'.", ip);

            return StatusCode(StatusCodes.Status201Created, new PermissionResponseDto
            {
                Id = perm.Id,
                Name = perm.Name,
                Description = perm.Description,
                Module = perm.Module
            });
        }
    }
}
