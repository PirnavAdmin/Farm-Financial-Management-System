using Agriman.Machinery.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Agriman.Machinery.Api.Data;

public class MachineryDbContext : DbContext
{
    public MachineryDbContext(DbContextOptions<MachineryDbContext> options) : base(options)
    {
    }

    public DbSet<Models.Machinery> Machineries => Set<Models.Machinery>();
    public DbSet<MachineryExpense> MachineryExpenses => Set<MachineryExpense>();
    public DbSet<MachineryExpenseType> MachineryExpenseTypes => Set<MachineryExpenseType>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Models.Machinery>(entity =>
        {
            entity.ToTable("machinery");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.MachineName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.MachineType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.RegistrationNo).HasMaxLength(100);
            entity.Property(e => e.PurchaseCost).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(e => e.CurrentValue).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(e => e.FuelType).HasMaxLength(50);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50).HasDefaultValue("Active");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasIndex(e => e.MachineName);
            entity.HasIndex(e => e.MachineType);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.RegistrationNo);
        });

        modelBuilder.Entity<MachineryExpense>(entity =>
        {
            entity.ToTable("machinery_expenses");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.MachineName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.ExpenseType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Date).IsRequired();
            entity.Property(e => e.Amount).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.Operator).HasMaxLength(150);
            entity.Property(e => e.Remarks).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasIndex(e => e.MachineryId);
            entity.HasIndex(e => e.MachineName);
            entity.HasIndex(e => e.ExpenseType);
            entity.HasIndex(e => e.Date);

            entity.HasOne(e => e.Machinery)
                .WithMany(m => m.Expenses)
                .HasForeignKey(e => e.MachineryId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<MachineryExpenseType>(entity =>
        {
            entity.ToTable("machinery_expense_types");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasIndex(e => e.Code).IsUnique();

            var seedCreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            entity.HasData(
                new MachineryExpenseType
                {
                    Id = 1,
                    Code = "FUEL",
                    Name = "Fuel",
                    Description = "Diesel, petrol, electric charging, and lubricants for farm machinery",
                    IsActive = true,
                    CreatedAt = seedCreatedAt
                },
                new MachineryExpenseType
                {
                    Id = 2,
                    Code = "MAINTENANCE",
                    Name = "Maintenance",
                    Description = "Scheduled servicing, oil change, filter replacement, and routine checks",
                    IsActive = true,
                    CreatedAt = seedCreatedAt
                },
                new MachineryExpenseType
                {
                    Id = 3,
                    Code = "REPAIR",
                    Name = "Repair & Spare Parts",
                    Description = "Breakdown repairs, spare parts, tyres, and workshop labour",
                    IsActive = true,
                    CreatedAt = seedCreatedAt
                },
                new MachineryExpenseType
                {
                    Id = 4,
                    Code = "OPERATOR_WAGES",
                    Name = "Operator Wages",
                    Description = "Driver and machinery operator daily or monthly wages",
                    IsActive = true,
                    CreatedAt = seedCreatedAt
                },
                new MachineryExpenseType
                {
                    Id = 5,
                    Code = "INSURANCE",
                    Name = "Insurance & Registration",
                    Description = "Machinery insurance premiums, permits, and registration renewals",
                    IsActive = true,
                    CreatedAt = seedCreatedAt
                },
                new MachineryExpenseType
                {
                    Id = 6,
                    Code = "OTHER",
                    Name = "Other",
                    Description = "Miscellaneous machinery operating and handling expenses",
                    IsActive = true,
                    CreatedAt = seedCreatedAt
                }
            );
        });
    }
}
