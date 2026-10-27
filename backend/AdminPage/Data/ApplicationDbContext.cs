using Microsoft.EntityFrameworkCore;
using AgriMan.Api.Models;

namespace AgriMan.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Role> Roles { get; set; } = null!;
        public DbSet<Permission> Permissions { get; set; } = null!;
        public DbSet<UserRole> UserRoles { get; set; } = null!;
        public DbSet<RolePermission> RolePermissions { get; set; } = null!;
        public DbSet<UserPermission> UserPermissions { get; set; } = null!;
        public DbSet<LoginHistory> LoginHistories { get; set; } = null!;
        public DbSet<AuditLog> AuditLogs { get; set; } = null!;
        public DbSet<CompanySetting> CompanySettings { get; set; } = null!;
        public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User Entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("users");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Email).IsUnique().HasFilter("[IsDeleted] = 0");
                entity.HasIndex(e => e.UserCode).IsUnique().HasFilter("[IsDeleted] = 0");
                entity.Property(e => e.UserCode).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(150);
                entity.Property(e => e.MobileNumber).HasMaxLength(25);
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.IsDeleted).HasDefaultValue(false);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

                // Soft-delete global query filter
                entity.HasQueryFilter(e => !e.IsDeleted);
            });

            // Role Entity
            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("roles");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Name).IsUnique();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Description).HasMaxLength(250);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // Permission Entity
            modelBuilder.Entity<Permission>(entity =>
            {
                entity.ToTable("permissions");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Name).IsUnique();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Module).IsRequired().HasMaxLength(50);
            });

            // UserRole (many-to-many join)
            modelBuilder.Entity<UserRole>(entity =>
            {
                entity.ToTable("user_roles");
                entity.HasKey(e => new { e.UserId, e.RoleId });

                entity.HasOne(e => e.User)
                      .WithMany(u => u.UserRoles)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Role)
                      .WithMany(r => r.UserRoles)
                      .HasForeignKey(e => e.RoleId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // RolePermission (many-to-many join)
            modelBuilder.Entity<RolePermission>(entity =>
            {
                entity.ToTable("role_permissions");
                entity.HasKey(e => new { e.RoleId, e.PermissionId });

                entity.HasOne(e => e.Role)
                      .WithMany(r => r.RolePermissions)
                      .HasForeignKey(e => e.RoleId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Permission)
                      .WithMany(p => p.RolePermissions)
                      .HasForeignKey(e => e.PermissionId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // UserPermission (direct custom user-permission overrides)
            modelBuilder.Entity<UserPermission>(entity =>
            {
                entity.ToTable("user_permissions");
                entity.HasKey(e => new { e.UserId, e.PermissionId });

                entity.HasOne(e => e.User)
                      .WithMany(u => u.UserPermissions)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Permission)
                      .WithMany(p => p.UserPermissions)
                      .HasForeignKey(e => e.PermissionId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // LoginHistory Entity
            modelBuilder.Entity<LoginHistory>(entity =>
            {
                entity.ToTable("login_history");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(30);
                entity.Property(e => e.LoginAt).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(e => e.User)
                      .WithMany(u => u.LoginHistories)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // AuditLog Entity
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.ToTable("audit_logs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Action).IsRequired().HasMaxLength(60);
                entity.Property(e => e.EntityType).IsRequired().HasMaxLength(60);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(e => e.ActorUser)
                      .WithMany()
                      .HasForeignKey(e => e.ActorUserId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // CompanySetting Entity
            modelBuilder.Entity<CompanySetting>(entity =>
            {
                entity.ToTable("company_settings");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CompanyName).IsRequired().HasMaxLength(150);
            });

            // RefreshToken Entity
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.ToTable("refresh_tokens");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Token).IsRequired().HasMaxLength(255);

                entity.HasOne(e => e.User)
                      .WithMany(u => u.RefreshTokens)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
