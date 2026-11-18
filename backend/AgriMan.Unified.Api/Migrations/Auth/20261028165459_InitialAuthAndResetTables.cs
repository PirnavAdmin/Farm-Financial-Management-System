using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AgriMan.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialAuthAndResetTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
-- 1. permissions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'permissions')
BEGIN
    CREATE TABLE [permissions] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(100) NOT NULL,
        [Description] nvarchar(250) NULL,
        [Module] nvarchar(50) NOT NULL,
        CONSTRAINT [PK_permissions] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_permissions_Name] ON [permissions] ([Name]);
END;

-- 2. roles
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'roles')
BEGIN
    CREATE TABLE [roles] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(50) NOT NULL,
        [Description] nvarchar(250) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_roles] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_roles_Name] ON [roles] ([Name]);
END;

-- 3. users
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE [users] (
        [Id] int NOT NULL IDENTITY,
        [UserCode] nvarchar(20) NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [Email] nvarchar(150) NOT NULL,
        [MobileNumber] nvarchar(25) NULL,
        [PasswordHash] nvarchar(max) NOT NULL,
        [IsActive] bit NOT NULL DEFAULT 1,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [LastLoginAt] datetime2 NULL,
        [ProfilePhoto] nvarchar(max) NULL,
        [PasswordResetToken] nvarchar(100) NULL,
        [ResetTokenExpires] datetime2 NULL,
        CONSTRAINT [PK_users] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_users_Email] ON [users] ([Email]) WHERE [IsDeleted] = 0;
    CREATE UNIQUE INDEX [IX_users_UserCode] ON [users] ([UserCode]) WHERE [IsDeleted] = 0;
END;

-- 4. role_permissions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'role_permissions')
BEGIN
    CREATE TABLE [role_permissions] (
        [RoleId] int NOT NULL,
        [PermissionId] int NOT NULL,
        CONSTRAINT [PK_role_permissions] PRIMARY KEY ([RoleId], [PermissionId]),
        CONSTRAINT [FK_role_permissions_permissions_PermissionId] FOREIGN KEY ([PermissionId]) REFERENCES [permissions] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_role_permissions_roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [roles] ([Id]) ON DELETE CASCADE
    );
    CREATE INDEX [IX_role_permissions_PermissionId] ON [role_permissions] ([PermissionId]);
END;

-- 5. user_roles
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_roles')
BEGIN
    CREATE TABLE [user_roles] (
        [UserId] int NOT NULL,
        [RoleId] int NOT NULL,
        CONSTRAINT [PK_user_roles] PRIMARY KEY ([UserId], [RoleId]),
        CONSTRAINT [FK_user_roles_roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [roles] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_user_roles_users_UserId] FOREIGN KEY ([UserId]) REFERENCES [users] ([Id]) ON DELETE CASCADE
    );
    CREATE INDEX [IX_user_roles_RoleId] ON [user_roles] ([RoleId]);
END;

-- 6. user_permissions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_permissions')
BEGIN
    CREATE TABLE [user_permissions] (
        [UserId] int NOT NULL,
        [PermissionId] int NOT NULL,
        CONSTRAINT [PK_user_permissions] PRIMARY KEY ([UserId], [PermissionId]),
        CONSTRAINT [FK_user_permissions_permissions_PermissionId] FOREIGN KEY ([PermissionId]) REFERENCES [permissions] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_user_permissions_users_UserId] FOREIGN KEY ([UserId]) REFERENCES [users] ([Id]) ON DELETE CASCADE
    );
    CREATE INDEX [IX_user_permissions_PermissionId] ON [user_permissions] ([PermissionId]);
END;

-- 7. login_history
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'login_history')
BEGIN
    CREATE TABLE [login_history] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NULL,
        [Email] nvarchar(150) NULL,
        [Identifier] nvarchar(150) NULL,
        [LoginAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [Status] nvarchar(30) NOT NULL,
        [IpAddress] nvarchar(60) NULL,
        [UserAgent] nvarchar(300) NULL,
        [RememberMe] bit NOT NULL DEFAULT 0,
        [FailureReason] nvarchar(250) NULL,
        CONSTRAINT [PK_login_history] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_login_history_users_UserId] FOREIGN KEY ([UserId]) REFERENCES [users] ([Id]) ON DELETE SET NULL
    );
    CREATE INDEX [IX_login_history_UserId] ON [login_history] ([UserId]);
END
ELSE
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('login_history') AND name = 'Identifier')
    BEGIN
        ALTER TABLE [login_history] ADD [Identifier] nvarchar(150) NULL;
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('login_history') AND name = 'RememberMe')
    BEGIN
        ALTER TABLE [login_history] ADD [RememberMe] bit NOT NULL DEFAULT 0;
    END;
END;

-- 8. password_resets (NEW TABLE for Screen 2 Forgot Password)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'password_resets')
BEGIN
    CREATE TABLE [password_resets] (
        [Id] int NOT NULL IDENTITY,
        [Identifier] nvarchar(150) NOT NULL,
        [UserId] int NULL,
        [Otp] nvarchar(10) NOT NULL,
        [ResetToken] nvarchar(150) NULL,
        [IsVerified] bit NOT NULL DEFAULT 0,
        [IsUsed] bit NOT NULL DEFAULT 0,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [ExpiresAt] datetime2 NOT NULL,
        [UsedAt] datetime2 NULL,
        [IpAddress] nvarchar(60) NULL,
        CONSTRAINT [PK_password_resets] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_password_resets_users_UserId] FOREIGN KEY ([UserId]) REFERENCES [users] ([Id]) ON DELETE SET NULL
    );
    CREATE INDEX [IX_password_resets_UserId] ON [password_resets] ([UserId]);
END;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "password_resets");
            migrationBuilder.DropTable(name: "login_history");
            migrationBuilder.DropTable(name: "user_permissions");
            migrationBuilder.DropTable(name: "user_roles");
            migrationBuilder.DropTable(name: "role_permissions");
            migrationBuilder.DropTable(name: "users");
            migrationBuilder.DropTable(name: "roles");
            migrationBuilder.DropTable(name: "permissions");
        }
    }
}
