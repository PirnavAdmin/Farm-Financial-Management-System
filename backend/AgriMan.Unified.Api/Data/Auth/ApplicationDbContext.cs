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
        public DbSet<PasswordReset> PasswordResets { get; set; } = null!;
        public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
        public DbSet<AuditLog> AuditLogs { get; set; } = null!;
        public DbSet<CompanySetting> CompanySettings { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User Entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("users");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.UserCode).IsUnique();
                entity.Property(e => e.UserCode).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(150);
                entity.Property(e => e.MobileNumber).HasMaxLength(25);
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.IsDeleted).HasDefaultValue(false);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

                // Query filter for soft delete
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
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
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

            // UserRole (Composite Key)
            modelBuilder.Entity<UserRole>(entity =>
            {
                entity.ToTable("user_roles");
                entity.HasKey(ur => new { ur.UserId, ur.RoleId });
                entity.HasQueryFilter(ur => !ur.User.IsDeleted);

                entity.HasOne(ur => ur.User)
                    .WithMany(u => u.UserRoles)
                    .HasForeignKey(ur => ur.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ur => ur.Role)
                    .WithMany(r => r.UserRoles)
                    .HasForeignKey(ur => ur.RoleId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // RolePermission (Composite Key)
            modelBuilder.Entity<RolePermission>(entity =>
            {
                entity.ToTable("role_permissions");
                entity.HasKey(rp => new { rp.RoleId, rp.PermissionId });

                entity.HasOne(rp => rp.Role)
                    .WithMany(r => r.RolePermissions)
                    .HasForeignKey(rp => rp.RoleId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(rp => rp.Permission)
                    .WithMany(p => p.RolePermissions)
                    .HasForeignKey(rp => rp.PermissionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // UserPermission (Composite Key)
            modelBuilder.Entity<UserPermission>(entity =>
            {
                entity.ToTable("user_permissions");
                entity.HasKey(up => new { up.UserId, up.PermissionId });
                entity.HasQueryFilter(up => !up.User.IsDeleted);

                entity.HasOne(up => up.User)
                    .WithMany(u => u.UserPermissions)
                    .HasForeignKey(up => up.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(up => up.Permission)
                    .WithMany(p => p.UserPermissions)
                    .HasForeignKey(up => up.PermissionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // LoginHistory Entity
            modelBuilder.Entity<LoginHistory>(entity =>
            {
                entity.ToTable("login_history");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(30);
                entity.Property(e => e.Email).HasMaxLength(150);
                entity.Property(e => e.Identifier).HasMaxLength(150);
                entity.Property(e => e.IpAddress).HasMaxLength(60);
                entity.Property(e => e.UserAgent).HasMaxLength(300);
                entity.Property(e => e.FailureReason).HasMaxLength(250);
                entity.Property(e => e.LoginAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(lh => lh.User)
                    .WithMany(u => u.LoginHistories)
                    .HasForeignKey(lh => lh.UserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // PasswordReset Entity
            modelBuilder.Entity<PasswordReset>(entity =>
            {
                entity.ToTable("password_resets");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Identifier).IsRequired().HasMaxLength(150);
                entity.Property(e => e.Otp).IsRequired().HasMaxLength(10);
                entity.Property(e => e.ResetToken).HasMaxLength(150);
                entity.Property(e => e.IpAddress).HasMaxLength(60);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(pr => pr.User)
                    .WithMany()
                    .HasForeignKey(pr => pr.UserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // RefreshToken Entity
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.ToTable("refresh_tokens");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Token);
                entity.Property(e => e.Token).IsRequired().HasMaxLength(255);
                entity.Property(e => e.IsRevoked).HasDefaultValue(false);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(rt => rt.User)
                    .WithMany(u => u.RefreshTokens)
                    .HasForeignKey(rt => rt.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // AuditLog Entity
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.ToTable("audit_logs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ActorName).HasMaxLength(100);
                entity.Property(e => e.Action).IsRequired().HasMaxLength(60);
                entity.Property(e => e.EntityType).IsRequired().HasMaxLength(60);
                entity.Property(e => e.EntityId).HasMaxLength(50);
                entity.Property(e => e.IpAddress).HasMaxLength(60);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(al => al.ActorUser)
                    .WithMany()
                    .HasForeignKey(al => al.ActorUserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // CompanySetting Entity
            modelBuilder.Entity<CompanySetting>(entity =>
            {
                entity.ToTable("company_settings");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CompanyName).IsRequired().HasMaxLength(150);
                entity.Property(e => e.Email).HasMaxLength(150);
                entity.Property(e => e.Phone).HasMaxLength(30);
                entity.Property(e => e.Address).HasMaxLength(255);
                entity.Property(e => e.City).HasMaxLength(100);
                entity.Property(e => e.Country).HasMaxLength(100);
                entity.Property(e => e.PostalCode).HasMaxLength(20);
                entity.Property(e => e.TaxNumber).HasMaxLength(50);
                entity.Property(e => e.Currency).IsRequired().HasMaxLength(10).HasDefaultValue("INR");
                entity.Property(e => e.Timezone).IsRequired().HasMaxLength(50).HasDefaultValue("Asia/Kolkata");
                entity.Property(e => e.Website).HasMaxLength(255);
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            });
        }
    }
}
