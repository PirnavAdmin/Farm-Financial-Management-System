using AgriMan.Api.Models;
using AgriMan.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace AgriMan.Api.Data
{
    public static class DbInitializer
    {
        public static async Task SeedAsync(ApplicationDbContext context, IPasswordHasher passwordHasher)
        {
            // Ensure all EF Core migrations are applied to SQL Server admindb
            await context.Database.MigrateAsync();

            // 1. Seed Permissions if empty
            if (!await context.Permissions.AnyAsync())
            {
                var permissions = new List<Permission>
                {
                    // Users Module
                    new() { Name = "users.view", Description = "View system users and details", Module = "Users" },
                    new() { Name = "users.create", Description = "Create new system users", Module = "Users" },
                    new() { Name = "users.edit", Description = "Edit existing users", Module = "Users" },
                    new() { Name = "users.delete", Description = "Soft-delete users", Module = "Users" },
                    new() { Name = "users.status", Description = "Activate or deactivate user accounts", Module = "Users" },
                    new() { Name = "users.roles", Description = "Assign roles to users", Module = "Users" },

                    // Roles Module
                    new() { Name = "roles.view", Description = "View roles and access rules", Module = "Roles" },
                    new() { Name = "roles.manage", Description = "Create and modify roles", Module = "Roles" },

                    // Company Settings Module
                    new() { Name = "company.view", Description = "View organization details", Module = "Company" },
                    new() { Name = "company.manage", Description = "Manage company profile and settings", Module = "Company" },

                    // Audit Logs Module
                    new() { Name = "audit.view", Description = "View security audit logs and login history", Module = "Audit" },

                    // Agriculture & Farm Ops
                    new() { Name = "agriculture.view", Description = "View crops, plots, and farm cycles", Module = "Agriculture" },
                    new() { Name = "agriculture.manage", Description = "Manage agricultural plans and harvest", Module = "Agriculture" },

                    // Finance Module
                    new() { Name = "finance.view", Description = "View transactions, ledgers, and accounts", Module = "Finance" },
                    new() { Name = "finance.manage", Description = "Manage farm invoices, payroll, and expenses", Module = "Finance" },

                    // Inventory Module
                    new() { Name = "inventory.view", Description = "View fertilizers, seeds, and equipment stock", Module = "Inventory" },
                    new() { Name = "inventory.manage", Description = "Stock intake, issuance, and adjustments", Module = "Inventory" },

                    // Reports Module
                    new() { Name = "reports.view", Description = "Generate and export business intelligence reports", Module = "Reports" }
                };

                await context.Permissions.AddRangeAsync(permissions);
                await context.SaveChangesAsync();
            }

            // 2. Seed Roles if empty
            if (!await context.Roles.AnyAsync())
            {
                var allPerms = await context.Permissions.ToListAsync();

                var adminRole = new Role
                {
                    Name = "Administrator",
                    Description = "Full administrative access across all farm modules and settings."
                };
                foreach (var p in allPerms)
                {
                    adminRole.RolePermissions.Add(new RolePermission { Permission = p });
                }

                var managerRole = new Role
                {
                    Name = "Manager",
                    Description = "Oversees daily farm operations, workforce, inventory, and reports."
                };
                foreach (var p in allPerms.Where(p => p.Module is "Users" or "Company" or "Agriculture" or "Inventory" or "Reports"))
                {
                    managerRole.RolePermissions.Add(new RolePermission { Permission = p });
                }

                var accountantRole = new Role
                {
                    Name = "Accountant",
                    Description = "Manages farm accounting, expenses, sales, invoices, and financial reports."
                };
                foreach (var p in allPerms.Where(p => p.Module is "Finance" or "Reports" or "Inventory"))
                {
                    accountantRole.RolePermissions.Add(new RolePermission { Permission = p });
                }

                var agronomistRole = new Role
                {
                    Name = "Agronomist",
                    Description = "Advises on crop health, soil preparation, planting cycles, and fertilizers."
                };
                foreach (var p in allPerms.Where(p => p.Module is "Agriculture" or "Reports"))
                {
                    agronomistRole.RolePermissions.Add(new RolePermission { Permission = p });
                }

                var supervisorRole = new Role
                {
                    Name = "Field Supervisor",
                    Description = "Monitors field laborers, machinery usage, and daily harvest logs."
                };
                foreach (var p in allPerms.Where(p => p.Module is "Agriculture" or "Inventory"))
                {
                    supervisorRole.RolePermissions.Add(new RolePermission { Permission = p });
                }

                var techRole = new Role
                {
                    Name = "Technician",
                    Description = "Calibrates smart sensors, drip irrigation systems, and drone telemetry."
                };
                foreach (var p in allPerms.Where(p => p.Name is "agriculture.view" or "inventory.view"))
                {
                    techRole.RolePermissions.Add(new RolePermission { Permission = p });
                }

                var farmerRole = new Role
                {
                    Name = "Farmer",
                    Description = "Field owner and basic operator profile."
                };
                foreach (var p in allPerms.Where(p => p.Name is "agriculture.view"))
                {
                    farmerRole.RolePermissions.Add(new RolePermission { Permission = p });
                }

                await context.Roles.AddRangeAsync(
                    adminRole, 
                    managerRole, 
                    accountantRole, 
                    agronomistRole, 
                    supervisorRole, 
                    techRole, 
                    farmerRole);
                await context.SaveChangesAsync();
            }

            // 3. Seed Users from Screenshot
            if (!await context.Users.IgnoreQueryFilters().AnyAsync())
            {
                var adminRole = await context.Roles.FirstAsync(r => r.Name == "Administrator");
                var managerRole = await context.Roles.FirstAsync(r => r.Name == "Manager");
                var accountantRole = await context.Roles.FirstAsync(r => r.Name == "Accountant");
                var agronomistRole = await context.Roles.FirstAsync(r => r.Name == "Agronomist");
                var supervisorRole = await context.Roles.FirstAsync(r => r.Name == "Field Supervisor");
                var techRole = await context.Roles.FirstAsync(r => r.Name == "Technician");

                var defaultPasswordHash = passwordHasher.HashPassword("AgriMan@2026");

                var now = DateTime.UtcNow;

                // 6 Users exactly corresponding to the Screenshot:
                // TOTAL USERS: 6, ACTIVE USERS: 5, INACTIVE USERS: 1
                var u1 = new User
                {
                    UserCode = "USR-001",
                    Name = "Arjun Mehta",
                    Email = "arjun.mehta@agriman.in",
                    MobileNumber = "+91 98765 43210",
                    PasswordHash = defaultPasswordHash,
                    IsActive = true,
                    LastLoginAt = now.Date.AddHours(9).AddMinutes(42), // Today, 09:42 AM
                    CreatedAt = now.AddMonths(-6)
                };
                u1.UserRoles.Add(new UserRole { Role = adminRole });

                var u2 = new User
                {
                    UserCode = "USR-002",
                    Name = "Priya Sharma",
                    Email = "priya.sharma@agriman.in",
                    MobileNumber = "+91 98765 12340",
                    PasswordHash = defaultPasswordHash,
                    IsActive = true,
                    LastLoginAt = now.Date.AddHours(8).AddMinutes(15), // Today, 08:15 AM
                    CreatedAt = now.AddMonths(-5)
                };
                u2.UserRoles.Add(new UserRole { Role = managerRole });

                var u3 = new User
                {
                    UserCode = "USR-003",
                    Name = "Rahul Verma",
                    Email = "rahul.verma@agriman.in",
                    MobileNumber = "+91 91234 56780",
                    PasswordHash = defaultPasswordHash,
                    IsActive = true,
                    LastLoginAt = now.Date.AddDays(-1).AddHours(16).AddMinutes(26), // Yesterday, 04:26 PM
                    CreatedAt = now.AddMonths(-4)
                };
                u3.UserRoles.Add(new UserRole { Role = accountantRole });

                var u4 = new User
                {
                    UserCode = "USR-004",
                    Name = "Vikram Patel",
                    Email = "vikram.patel@agriman.in",
                    MobileNumber = "+91 98220 11223",
                    PasswordHash = defaultPasswordHash,
                    IsActive = true,
                    LastLoginAt = now.Date.AddDays(-2).AddHours(14).AddMinutes(10), // 2 days ago
                    CreatedAt = now.AddMonths(-3)
                };
                u4.UserRoles.Add(new UserRole { Role = agronomistRole });

                var u5 = new User
                {
                    UserCode = "USR-005",
                    Name = "Ananya Rao",
                    Email = "ananya.rao@agriman.in",
                    MobileNumber = "+91 97330 44556",
                    PasswordHash = defaultPasswordHash,
                    IsActive = true,
                    LastLoginAt = now.Date.AddDays(-3).AddHours(11).AddMinutes(5), // 3 days ago
                    CreatedAt = now.AddMonths(-2)
                };
                u5.UserRoles.Add(new UserRole { Role = supervisorRole });

                var u6 = new User
                {
                    UserCode = "USR-006",
                    Name = "Suresh Reddy",
                    Email = "suresh.reddy@agriman.in",
                    MobileNumber = "+91 96110 77889",
                    PasswordHash = defaultPasswordHash,
                    IsActive = false, // Inactive user from screenshot!
                    LastLoginAt = now.Date.AddDays(-5).AddHours(17).AddMinutes(30), // 5 days ago
                    CreatedAt = now.AddMonths(-1)
                };
                u6.UserRoles.Add(new UserRole { Role = techRole });

                await context.Users.AddRangeAsync(u1, u2, u3, u4, u5, u6);
                await context.SaveChangesAsync();

                // Also seed Login History
                var loginHistories = new List<LoginHistory>
                {
                    new() { UserId = u1.Id, Email = u1.Email, LoginAt = now.Date.AddHours(9).AddMinutes(42), Status = "Success", IpAddress = "192.168.1.101", UserAgent = "Chrome / Windows 11" },
                    new() { UserId = u2.Id, Email = u2.Email, LoginAt = now.Date.AddHours(8).AddMinutes(15), Status = "Success", IpAddress = "192.168.1.105", UserAgent = "Edge / macOS" },
                    new() { UserId = u3.Id, Email = u3.Email, LoginAt = now.Date.AddDays(-1).AddHours(16).AddMinutes(26), Status = "Success", IpAddress = "192.168.1.110", UserAgent = "Firefox / Ubuntu" },
                    new() { UserId = u4.Id, Email = u4.Email, LoginAt = now.Date.AddDays(-2).AddHours(14).AddMinutes(10), Status = "Success", IpAddress = "192.168.1.112", UserAgent = "Chrome / Android" },
                    new() { UserId = u6.Id, Email = u6.Email, LoginAt = now.Date.AddDays(-5).AddHours(17).AddMinutes(30), Status = "Success", IpAddress = "192.168.1.140", UserAgent = "Mobile Safari / iOS" },
                    new() { UserId = u6.Id, Email = u6.Email, LoginAt = now.Date.AddDays(-4).AddHours(10).AddMinutes(12), Status = "Failed", IpAddress = "192.168.1.140", UserAgent = "Mobile Safari / iOS", FailureReason = "Incorrect password" }
                };
                await context.LoginHistories.AddRangeAsync(loginHistories);

                // Also seed initial Audit Logs
                var auditLogs = new List<AuditLog>
                {
                    new() { ActorUserId = u1.Id, ActorName = "Arjun Mehta", Action = "CREATE", EntityType = "User", EntityId = u6.Id.ToString(), Details = "Created user account for Suresh Reddy", CreatedAt = now.AddDays(-10), IpAddress = "192.168.1.101" },
                    new() { ActorUserId = u1.Id, ActorName = "Arjun Mehta", Action = "DEACTIVATE", EntityType = "User", EntityId = u6.Id.ToString(), Details = "Paused account access for Suresh Reddy", CreatedAt = now.AddDays(-4), IpAddress = "192.168.1.101" },
                    new() { ActorUserId = u1.Id, ActorName = "Arjun Mehta", Action = "ASSIGN_ROLES", EntityType = "User", EntityId = u3.Id.ToString(), Details = "Assigned Accountant role to Rahul Verma", CreatedAt = now.AddDays(-20), IpAddress = "192.168.1.101" }
                };
                await context.AuditLogs.AddRangeAsync(auditLogs);

                await context.SaveChangesAsync();
            }

            // 4. Seed Company Settings if empty
            if (!await context.CompanySettings.AnyAsync())
            {
                var company = new CompanySetting
                {
                    CompanyName = "AGRIMAN Farms Pvt Ltd",
                    Email = "contact@agriman.in",
                    Phone = "+91 98765 00000",
                    Address = "Plot 42, Green Agro Tech Park, Agri Corridor",
                    City = "Hyderabad",
                    Country = "India",
                    PostalCode = "500081",
                    TaxNumber = "GSTIN36AABCA1234F1Z5",
                    Currency = "INR",
                    Timezone = "Asia/Kolkata",
                    Website = "https://agriman.in",
                    UpdatedAt = DateTime.UtcNow
                };

                await context.CompanySettings.AddAsync(company);
                await context.SaveChangesAsync();
            }
        }
    }
}
