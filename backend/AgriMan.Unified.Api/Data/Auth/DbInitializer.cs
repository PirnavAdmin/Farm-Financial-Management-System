using AgriMan.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AgriMan.Api.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(ApplicationDbContext context)
        {
            try
            {
                // Seed Roles
                if (!await context.Roles.AnyAsync())
                {
                    var roles = new List<Role>
                    {
                        new Role { Name = "Administrator", Description = "Full access to all system features and settings" },
                        new Role { Name = "Manager", Description = "Can manage farm operations, inventory, and users" },
                        new Role { Name = "Accountant", Description = "Access to financial modules, transactions, and reports" }
                    };
                    await context.Roles.AddRangeAsync(roles);
                    await context.SaveChangesAsync();
                }

                // Seed Permissions
                if (!await context.Permissions.AnyAsync())
                {
                    var permissions = new List<Permission>
                    {
                        new Permission { Name = "Users.View", Module = "Settings", Description = "View users list" },
                        new Permission { Name = "Users.Create", Module = "Settings", Description = "Create new users" },
                        new Permission { Name = "Users.Edit", Module = "Settings", Description = "Edit existing users" },
                        new Permission { Name = "Users.Delete", Module = "Settings", Description = "Delete users" },
                        new Permission { Name = "Roles.Manage", Module = "Settings", Description = "Manage roles and permissions" },
                        new Permission { Name = "Finance.View", Module = "Finance", Description = "View financial reports" },
                        new Permission { Name = "Agriculture.View", Module = "Agriculture", Description = "View agriculture data" }
                    };
                    await context.Permissions.AddRangeAsync(permissions);
                    await context.SaveChangesAsync();

                    var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Administrator");
                    if (adminRole != null)
                    {
                        var allPerms = await context.Permissions.ToListAsync();
                        foreach (var p in allPerms)
                        {
                            if (!await context.RolePermissions.AnyAsync(rp => rp.RoleId == adminRole.Id && rp.PermissionId == p.Id))
                            {
                                context.RolePermissions.Add(new RolePermission { RoleId = adminRole.Id, PermissionId = p.Id });
                            }
                        }
                        await context.SaveChangesAsync();
                    }
                }

                var adminRoleEntity = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Administrator");

                // Ensure Prathap G exists as primary Administrator
                var prathapUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "gprathap922@gmail.com");
                if (prathapUser == null)
                {
                    string prathapHash = BCrypt.Net.BCrypt.HashPassword("Prathap@2026");
                    prathapUser = new User
                    {
                        UserCode = "USR-001",
                        Name = "Prathap G",
                        Email = "gprathap922@gmail.com",
                        MobileNumber = "+91 98491 23456",
                        PasswordHash = prathapHash,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    context.Users.Add(prathapUser);
                    await context.SaveChangesAsync();

                    if (adminRoleEntity != null)
                    {
                        context.UserRoles.Add(new UserRole { UserId = prathapUser.Id, RoleId = adminRoleEntity.Id });
                        await context.SaveChangesAsync();
                    }
                }
                else
                {
                    // Ensure password hash is properly BCrypt hashed and active
                    if (string.IsNullOrEmpty(prathapUser.PasswordHash) || prathapUser.PasswordHash == "Prathap@2026" || !prathapUser.PasswordHash.StartsWith("$2"))
                    {
                        prathapUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Prathap@2026");
                        prathapUser.IsActive = true;
                        prathapUser.IsDeleted = false;
                        await context.SaveChangesAsync();
                    }

                    if (adminRoleEntity != null && !await context.UserRoles.AnyAsync(ur => ur.UserId == prathapUser.Id && ur.RoleId == adminRoleEntity.Id))
                    {
                        context.UserRoles.Add(new UserRole { UserId = prathapUser.Id, RoleId = adminRoleEntity.Id });
                        await context.SaveChangesAsync();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"DbInitializer non-fatal error: {ex.Message}");
            }
        }
    }
}
