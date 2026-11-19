using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AgriMan.Unified.Api.Migrations.Auth
{
    /// <inheritdoc />
    public partial class InitialMySqlAuthModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            // Idempotent MySQL 8.0 DDL so this migration succeeds on both fresh and pre-existing agriman_db instances.
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS `users` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `UserCode` VARCHAR(20) NOT NULL UNIQUE,
    `Name` VARCHAR(100) NOT NULL,
    `Email` VARCHAR(150) NOT NULL UNIQUE,
    `MobileNumber` VARCHAR(25) DEFAULT NULL,
    `PasswordHash` LONGTEXT NOT NULL,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    `IsDeleted` TINYINT(1) NOT NULL DEFAULT 0,
    `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `UpdatedAt` DATETIME(6) DEFAULT NULL,
    `LastLoginAt` DATETIME(6) DEFAULT NULL,
    `ProfilePhoto` LONGTEXT DEFAULT NULL,
    `PasswordResetToken` VARCHAR(100) DEFAULT NULL,
    `ResetTokenExpires` DATETIME(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `roles` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Name` VARCHAR(50) NOT NULL UNIQUE,
    `Description` VARCHAR(250) DEFAULT NULL,
    `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `permissions` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Name` VARCHAR(100) NOT NULL UNIQUE,
    `Description` VARCHAR(250) DEFAULT NULL,
    `Module` VARCHAR(50) NOT NULL DEFAULT 'General'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_roles` (
    `UserId` INT NOT NULL,
    `RoleId` INT NOT NULL,
    PRIMARY KEY (`UserId`, `RoleId`),
    CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`RoleId`) REFERENCES `roles` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `role_permissions` (
    `RoleId` INT NOT NULL,
    `PermissionId` INT NOT NULL,
    PRIMARY KEY (`RoleId`, `PermissionId`),
    CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`RoleId`) REFERENCES `roles` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`PermissionId`) REFERENCES `permissions` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_permissions` (
    `UserId` INT NOT NULL,
    `PermissionId` INT NOT NULL,
    PRIMARY KEY (`UserId`, `PermissionId`),
    CONSTRAINT `fk_user_permissions_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_permissions_permission` FOREIGN KEY (`PermissionId`) REFERENCES `permissions` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `login_history` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `UserId` INT DEFAULT NULL,
    `Email` VARCHAR(150) DEFAULT NULL,
    `Identifier` VARCHAR(150) DEFAULT NULL,
    `LoginAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `Status` VARCHAR(30) NOT NULL DEFAULT 'Success',
    `IpAddress` VARCHAR(60) DEFAULT NULL,
    `UserAgent` VARCHAR(300) DEFAULT NULL,
    `RememberMe` TINYINT(1) NOT NULL DEFAULT 0,
    `FailureReason` VARCHAR(250) DEFAULT NULL,
    CONSTRAINT `fk_login_history_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `password_resets` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Identifier` VARCHAR(150) NOT NULL,
    `UserId` INT DEFAULT NULL,
    `Otp` VARCHAR(10) NOT NULL,
    `ResetToken` VARCHAR(150) DEFAULT NULL,
    `IsVerified` TINYINT(1) NOT NULL DEFAULT 0,
    `IsUsed` TINYINT(1) NOT NULL DEFAULT 0,
    `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `ExpiresAt` DATETIME(6) NOT NULL,
    `UsedAt` DATETIME(6) DEFAULT NULL,
    `IpAddress` VARCHAR(60) DEFAULT NULL,
    INDEX `idx_pw_identifier` (`Identifier`),
    CONSTRAINT `fk_pw_resets_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `UserId` INT NOT NULL,
    `Token` VARCHAR(255) NOT NULL,
    `ExpiresAt` DATETIME(6) NOT NULL,
    `IsRevoked` TINYINT(1) NOT NULL DEFAULT 0,
    `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX `idx_refresh_tokens_token` (`Token`),
    CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `ActorUserId` INT DEFAULT NULL,
    `ActorName` VARCHAR(100) DEFAULT NULL,
    `Action` VARCHAR(60) NOT NULL,
    `EntityType` VARCHAR(60) NOT NULL,
    `EntityId` VARCHAR(50) DEFAULT NULL,
    `Details` LONGTEXT DEFAULT NULL,
    `IpAddress` VARCHAR(60) DEFAULT NULL,
    `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`ActorUserId`) REFERENCES `users` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `company_settings` (
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
    `UpdatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");

            migrationBuilder.Sql(@"
SET @col_identifier_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'login_history' AND COLUMN_NAME = 'Identifier'
);
SET @sql_add_identifier = IF(@col_identifier_exists = 0,
    'ALTER TABLE `login_history` ADD COLUMN `Identifier` VARCHAR(150) DEFAULT NULL AFTER `Email`',
    'SELECT 1');
PREPARE stmt_id FROM @sql_add_identifier;
EXECUTE stmt_id;
DEALLOCATE PREPARE stmt_id;

SET @col_remember_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'login_history' AND COLUMN_NAME = 'RememberMe'
);
SET @sql_add_remember = IF(@col_remember_exists = 0,
    'ALTER TABLE `login_history` ADD COLUMN `RememberMe` TINYINT(1) NOT NULL DEFAULT 0 AFTER `UserAgent`',
    'SELECT 1');
PREPARE stmt_rem FROM @sql_add_remember;
EXECUTE stmt_rem;
DEALLOCATE PREPARE stmt_rem;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DROP TABLE IF EXISTS `refresh_tokens`;
DROP TABLE IF EXISTS `password_resets`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `company_settings`;
DROP TABLE IF EXISTS `login_history`;
DROP TABLE IF EXISTS `user_permissions`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `users`;
");
        }
    }
}
