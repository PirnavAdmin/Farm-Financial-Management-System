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
                await EnsureModule1SchemaAsync(context);

                // Seed Roles (idempotent)
                var defaultRoles = new List<(string Name, string Description)>
                {
                    ("Administrator", "Full access to all system features and settings"),
                    ("Manager", "Can manage farm operations, inventory, and users"),
                    ("Accountant", "Access to financial modules, transactions, and reports"),
                    ("Field Supervisor", "Manage assigned farms, crops, and field operations"),
                    ("Field Staff", "Record field activities, attendance, and basic farm updates"),
                    ("Viewer", "Read-only access to dashboards and reports")
                };

                var existingRoleNames = await context.Roles
                    .Select(r => r.Name.ToLower())
                    .ToListAsync();
                var roleSet = new HashSet<string>(existingRoleNames);

                var rolesToAdd = defaultRoles
                    .Where(r => !roleSet.Contains(r.Name.ToLower()))
                    .Select(r => new Role { Name = r.Name, Description = r.Description })
                    .ToList();

                if (rolesToAdd.Count > 0)
                {
                    await context.Roles.AddRangeAsync(rolesToAdd);
                    await context.SaveChangesAsync();
                }

                // Seed Permissions (idempotent)
                var defaultPermissions = new List<(string Name, string Module, string Description)>
                {
                    ("Dashboard.View", "Dashboard", "View main farm financial dashboard"),
                    ("Users.View", "Settings", "View users list"),
                    ("Users.Create", "Settings", "Create new users"),
                    ("Users.Edit", "Settings", "Edit existing users"),
                    ("Users.Delete", "Settings", "Delete users"),
                    ("Roles.Manage", "Settings", "Manage roles and permissions"),
                    ("Company.Manage", "Settings", "View and update company settings"),
                    ("AuditLogs.View", "Settings", "View audit logs and login history"),
                    ("Farmers.Manage", "Masters", "Manage farmers, addresses, and bank accounts"),
                    ("Farms.Manage", "Masters", "Manage farms, land details, and documents"),
                    ("Crops.Manage", "Agriculture", "Manage crops, seasons, and crop activities"),
                    ("Agriculture.View", "Agriculture", "View agriculture data"),
                    ("Finance.View", "Finance", "View financial reports"),
                    ("Income.Manage", "Finance", "Manage farm income transactions and receipts"),
                    ("Expenses.Manage", "Finance", "Manage farm expense transactions and payments"),
                    ("Purchases.Manage", "Inventory", "Manage suppliers and purchase orders"),
                    ("Inventory.Manage", "Inventory", "Manage products, stock in/out, and adjustments"),
                    ("Sales.Manage", "Sales", "Manage produce sales and customer receivables"),
                    ("Reports.View", "Reports", "View and export financial and agriculture reports")
                };

                var existingPermNames = await context.Permissions
                    .Select(p => p.Name.ToLower())
                    .ToListAsync();
                var permSet = new HashSet<string>(existingPermNames);

                var permsToAdd = defaultPermissions
                    .Where(p => !permSet.Contains(p.Name.ToLower()))
                    .Select(p => new Permission { Name = p.Name, Module = p.Module, Description = p.Description })
                    .ToList();

                if (permsToAdd.Count > 0)
                {
                    await context.Permissions.AddRangeAsync(permsToAdd);
                    await context.SaveChangesAsync();
                }

                // Ensure Administrator role has all permissions
                var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Administrator");
                if (adminRole != null)
                {
                    var allPerms = await context.Permissions.Select(p => p.Id).ToListAsync();
                    var existingAdminPermIds = await context.RolePermissions
                        .Where(rp => rp.RoleId == adminRole.Id)
                        .Select(rp => rp.PermissionId)
                        .ToListAsync();
                    var existingAdminPermSet = new HashSet<int>(existingAdminPermIds);

                    var missingAdminRolePerms = allPerms
                        .Where(pid => !existingAdminPermSet.Contains(pid))
                        .Select(pid => new RolePermission { RoleId = adminRole.Id, PermissionId = pid })
                        .ToList();

                    if (missingAdminRolePerms.Count > 0)
                    {
                        await context.RolePermissions.AddRangeAsync(missingAdminRolePerms);
                        await context.SaveChangesAsync();
                    }
                }

                // Ensure default Company Settings row exists
                if (!await context.CompanySettings.AnyAsync())
                {
                    context.CompanySettings.Add(new CompanySetting
                    {
                        CompanyName = "AGRIMAN Farms Pvt Ltd",
                        Email = "contact@agriman.in",
                        Phone = "+91 98765 00000",
                        Address = "Plot 42, Green Agro Tech Park, Farm City",
                        City = "Hyderabad",
                        Country = "India",
                        PostalCode = "500081",
                        TaxNumber = "GSTIN36AABCA1234F1Z5",
                        Currency = "INR",
                        Timezone = "Asia/Kolkata",
                        Website = "https://agriman.in",
                        UpdatedAt = DateTime.UtcNow
                    });
                    await context.SaveChangesAsync();
                }

                // Ensure Prathap G exists as primary Administrator
                var prathapUser = await context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == "gprathap922@gmail.com");
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

                    if (adminRole != null)
                    {
                        context.UserRoles.Add(new UserRole { UserId = prathapUser.Id, RoleId = adminRole.Id });
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

                    if (adminRole != null && !await context.UserRoles.AnyAsync(ur => ur.UserId == prathapUser.Id && ur.RoleId == adminRole.Id))
                    {
                        context.UserRoles.Add(new UserRole { UserId = prathapUser.Id, RoleId = adminRole.Id });
                        await context.SaveChangesAsync();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"DbInitializer non-fatal error: {ex.Message}");
            }
        }

        private static async Task EnsureModule1SchemaAsync(ApplicationDbContext context)
        {
            var ddlStatements = new[]
            {
                @"CREATE TABLE IF NOT EXISTS `users` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `UserCode` VARCHAR(20) NOT NULL UNIQUE,
                    `Name` VARCHAR(100) NOT NULL,
                    `Email` VARCHAR(150) NOT NULL UNIQUE,
                    `MobileNumber` VARCHAR(25) DEFAULT NULL,
                    `PasswordHash` VARCHAR(255) NOT NULL,
                    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
                    `IsDeleted` TINYINT(1) NOT NULL DEFAULT 0,
                    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `UpdatedAt` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
                    `LastLoginAt` DATETIME DEFAULT NULL,
                    `ProfilePhoto` LONGTEXT DEFAULT NULL,
                    `PasswordResetToken` VARCHAR(100) DEFAULT NULL,
                    `ResetTokenExpires` DATETIME DEFAULT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

                @"CREATE TABLE IF NOT EXISTS `roles` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `Name` VARCHAR(50) NOT NULL UNIQUE,
                    `Description` VARCHAR(250) DEFAULT NULL,
                    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

                @"CREATE TABLE IF NOT EXISTS `permissions` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `Name` VARCHAR(100) NOT NULL UNIQUE,
                    `Description` VARCHAR(250) DEFAULT NULL,
                    `Module` VARCHAR(50) NOT NULL DEFAULT 'General'
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

                @"CREATE TABLE IF NOT EXISTS `user_roles` (
                    `UserId` INT NOT NULL,
                    `RoleId` INT NOT NULL,
                    PRIMARY KEY (`UserId`, `RoleId`),
                    CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE CASCADE,
                    CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`RoleId`) REFERENCES `roles` (`Id`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

                @"CREATE TABLE IF NOT EXISTS `role_permissions` (
                    `RoleId` INT NOT NULL,
                    `PermissionId` INT NOT NULL,
                    PRIMARY KEY (`RoleId`, `PermissionId`),
                    CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`RoleId`) REFERENCES `roles` (`Id`) ON DELETE CASCADE,
                    CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`PermissionId`) REFERENCES `permissions` (`Id`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

                @"CREATE TABLE IF NOT EXISTS `user_permissions` (
                    `UserId` INT NOT NULL,
                    `PermissionId` INT NOT NULL,
                    PRIMARY KEY (`UserId`, `PermissionId`),
                    CONSTRAINT `fk_user_permissions_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE CASCADE,
                    CONSTRAINT `fk_user_permissions_permission` FOREIGN KEY (`PermissionId`) REFERENCES `permissions` (`Id`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

                @"CREATE TABLE IF NOT EXISTS `login_history` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `UserId` INT DEFAULT NULL,
                    `Email` VARCHAR(150) DEFAULT NULL,
                    `Identifier` VARCHAR(150) DEFAULT NULL,
                    `LoginAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `Status` VARCHAR(30) NOT NULL DEFAULT 'Success',
                    `IpAddress` VARCHAR(60) DEFAULT NULL,
                    `UserAgent` VARCHAR(300) DEFAULT NULL,
                    `RememberMe` TINYINT(1) NOT NULL DEFAULT 0,
                    `FailureReason` VARCHAR(250) DEFAULT NULL,
                    CONSTRAINT `fk_login_history_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE SET NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

                @"CREATE TABLE IF NOT EXISTS `password_resets` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `Identifier` VARCHAR(150) NOT NULL,
                    `UserId` INT DEFAULT NULL,
                    `Otp` VARCHAR(10) NOT NULL,
                    `ResetToken` VARCHAR(150) DEFAULT NULL,
                    `IsVerified` TINYINT(1) NOT NULL DEFAULT 0,
                    `IsUsed` TINYINT(1) NOT NULL DEFAULT 0,
                    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `ExpiresAt` DATETIME NOT NULL,
                    `UsedAt` DATETIME DEFAULT NULL,
                    `IpAddress` VARCHAR(60) DEFAULT NULL,
                    INDEX `idx_pw_identifier` (`Identifier`),
                    CONSTRAINT `fk_pw_resets_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE SET NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

                @"CREATE TABLE IF NOT EXISTS `refresh_tokens` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `UserId` INT NOT NULL,
                    `Token` VARCHAR(255) NOT NULL,
                    `ExpiresAt` DATETIME NOT NULL,
                    `IsRevoked` TINYINT(1) NOT NULL DEFAULT 0,
                    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    INDEX `idx_refresh_tokens_token` (`Token`),
                    CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

                @"CREATE TABLE IF NOT EXISTS `audit_logs` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `ActorUserId` INT DEFAULT NULL,
                    `ActorName` VARCHAR(100) DEFAULT NULL,
                    `Action` VARCHAR(60) NOT NULL,
                    `EntityType` VARCHAR(60) NOT NULL,
                    `EntityId` VARCHAR(50) DEFAULT NULL,
                    `Details` TEXT DEFAULT NULL,
                    `IpAddress` VARCHAR(60) DEFAULT NULL,
                    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`ActorUserId`) REFERENCES `users` (`Id`) ON DELETE SET NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

                @"CREATE TABLE IF NOT EXISTS `company_settings` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `CompanyName` VARCHAR(150) NOT NULL DEFAULT 'AGRIMAN Farms Pvt Ltd',
                    `Email` VARCHAR(150) DEFAULT 'contact@agriman.in',
                    `Phone` VARCHAR(30) DEFAULT '+91 98765 00000',
                    `Address` VARCHAR(255) DEFAULT 'Plot 42, Green Agro Tech Park, Farm City',
                    `City` VARCHAR(100) DEFAULT 'Hyderabad',
                    `Country` VARCHAR(100) DEFAULT 'India',
                    `PostalCode` VARCHAR(20) DEFAULT '500081',
                    `TaxNumber` VARCHAR(50) DEFAULT 'GSTIN36AABCA1234F1Z5',
                    `Currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
                    `Timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
                    `Website` VARCHAR(255) DEFAULT 'https://agriman.in',
                    `UpdatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"
            };

            foreach (var sql in ddlStatements)
            {
                try
                {
                    await context.Database.ExecuteSqlRawAsync(sql);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"DbInitializer schema ensure notice: {ex.Message}");
                }
            }

            // Ensure Identifier and RememberMe columns exist on pre-existing login_history tables without throwing duplicate column errors
            var optionalColumns = new (string ColumnName, string AlterSql)[]
            {
                ("Identifier", "ALTER TABLE `login_history` ADD COLUMN `Identifier` VARCHAR(150) DEFAULT NULL AFTER `Email`;"),
                ("RememberMe", "ALTER TABLE `login_history` ADD COLUMN `RememberMe` TINYINT(1) NOT NULL DEFAULT 0 AFTER `UserAgent`;")
            };

            foreach (var (columnName, alterSql) in optionalColumns)
            {
                try
                {
                    using var cmd = context.Database.GetDbConnection().CreateCommand();
                    cmd.CommandText = $"SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'login_history' AND COLUMN_NAME = '{columnName}';";
                    if (context.Database.GetDbConnection().State != System.Data.ConnectionState.Open)
                    {
                        await context.Database.OpenConnectionAsync();
                    }
                    var count = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                    if (count == 0)
                    {
                        await context.Database.ExecuteSqlRawAsync(alterSql);
                    }
                }
                catch
                {
                    // Column already exists or table does not exist yet; safe to ignore
                }
            }
        }
    }
}
