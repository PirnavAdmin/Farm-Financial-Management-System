using AgriMan.Expenses.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AgriMan.Expenses.Api.Data;

/// <summary>
/// Entity Framework Core database context for the AGRIMAN Expenses module.
/// Configured for Microsoft SQL Server with database 'expendituredb'.
/// </summary>
public class ExpenseDbContext : DbContext
{
    public ExpenseDbContext(DbContextOptions<ExpenseDbContext> options) : base(options)
    {
    }

    public DbSet<ExpenseCategory> ExpenseCategories => Set<ExpenseCategory>();
    public DbSet<ExpenseTransaction> ExpenseTransactions => Set<ExpenseTransaction>();
    public DbSet<ExpenseItem> ExpenseItems => Set<ExpenseItem>();
    public DbSet<ExpensePayment> ExpensePayments => Set<ExpensePayment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. ExpenseCategory entity configuration
        modelBuilder.Entity<ExpenseCategory>(entity =>
        {
            entity.ToTable("expense_categories");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // 2. ExpenseTransaction entity configuration
        modelBuilder.Entity<ExpenseTransaction>(entity =>
        {
            entity.ToTable("expense_transactions");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ExpenseNo).IsUnique();
            entity.HasIndex(e => e.ExpenseDate);
            entity.HasIndex(e => e.Farmer);
            entity.HasIndex(e => e.Farm);
            entity.HasIndex(e => e.Crop);
            entity.HasIndex(e => e.ExpenseCategory);
            entity.HasIndex(e => e.Supplier);
            entity.HasIndex(e => e.PaymentMode);
            entity.HasIndex(e => e.Status);

            entity.Property(e => e.ExpenseNo).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Farmer).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Farm).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Crop).HasMaxLength(100).IsRequired();
            entity.Property(e => e.ExpenseCategory).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Supplier).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.Property(e => e.PaymentMode).HasMaxLength(50).HasDefaultValue("Cash");
            entity.Property(e => e.ReferenceNo).HasMaxLength(100);
            entity.Property(e => e.Remarks).HasMaxLength(500);
            entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Paid");
            entity.Property(e => e.ReceiptAttachmentUrl).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.Category)
                  .WithMany(c => c.Expenses)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(e => e.Items)
                  .WithOne(i => i.Expense)
                  .HasForeignKey(i => i.ExpenseId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Payments)
                  .WithOne(p => p.Expense)
                  .HasForeignKey(p => p.ExpenseId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // 3. ExpenseItem entity configuration
        modelBuilder.Entity<ExpenseItem>(entity =>
        {
            entity.ToTable("expense_items");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ItemName).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Unit).HasMaxLength(20).HasDefaultValue("unit");
            entity.Property(e => e.Quantity).HasPrecision(18, 2);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
            entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
            entity.Property(e => e.Remarks).HasMaxLength(255);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // 4. ExpensePayment entity configuration
        modelBuilder.Entity<ExpensePayment>(entity =>
        {
            entity.ToTable("expense_payments");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PaymentMode).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.Property(e => e.BankOrCash).HasMaxLength(100).IsRequired();
            entity.Property(e => e.ReferenceNo).HasMaxLength(100);
            entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Completed");
            entity.Property(e => e.Remarks).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // 5. Seed Expense Categories
        modelBuilder.Entity<ExpenseCategory>().HasData(
            new ExpenseCategory { Id = 1, Code = "FERTILIZERS", Name = "Fertilizers", Description = "Nutrients, chemical fertilizers, organic compost, urea, potash, and micronutrients", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new ExpenseCategory { Id = 2, Code = "LABOUR", Name = "Labour", Description = "Daily wage labour, harvesting, weeding, sowing, sprayers, and farm workers", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new ExpenseCategory { Id = 3, Code = "SEEDS", Name = "Seeds & Seedlings", Description = "Certified seeds, hybrid varieties, nursery saplings, and planting materials", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new ExpenseCategory { Id = 4, Code = "PESTICIDES", Name = "Pesticides & Crop Protection", Description = "Insecticides, fungicides, herbicides, biopesticides, and crop protectants", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new ExpenseCategory { Id = 5, Code = "MACHINERY", Name = "Machinery & Equipment Rental", Description = "Tractor rental, combine harvesters, rotavator, thresher, and machinery hire charges", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new ExpenseCategory { Id = 6, Code = "FUEL_ENERGY", Name = "Fuel & Electricity", Description = "Diesel for tractors and water pumps, generator fuel, and farm electricity bills", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new ExpenseCategory { Id = 7, Code = "IRRIGATION", Name = "Irrigation & Water", Description = "Borewell repairs, drip irrigation pipes, sprinkler maintenance, water tanker purchase", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new ExpenseCategory { Id = 8, Code = "VETERINARY", Name = "Veterinary & Animal Feed", Description = "Livestock fodder, cattle feed, vaccines, medicines, veterinary doctor charges", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new ExpenseCategory { Id = 9, Code = "LAND_RENT", Name = "Land Lease & Rent", Description = "Annual farmland lease rent, agricultural warehouse storage rental fees", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new ExpenseCategory { Id = 10, Code = "MISCELLANEOUS", Name = "Miscellaneous & Maintenance", Description = "Fencing repairs, gunny bags, transport and haulage, miscellaneous farm expenses", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );

        // 6. Seed Expense Transactions (matching the UI screenshot exactly!)
        modelBuilder.Entity<ExpenseTransaction>().HasData(
            new ExpenseTransaction
            {
                Id = 1,
                ExpenseNo = "EXP-2026-0098",
                ExpenseDate = new DateTime(2026, 10, 22, 0, 0, 0, DateTimeKind.Utc),
                Farmer = "Arjun Mehta",
                Farm = "North Field",
                Crop = "Paddy",
                CategoryId = 1,
                ExpenseCategory = "Fertilizers",
                Supplier = "GreenGrow Supplies",
                Description = "Urea and potash",
                Amount = 18500.00m,
                PaymentMode = "Bank",
                ReferenceNo = "UTR-09133",
                Remarks = "Season initial fertilizer application",
                Status = "Paid",
                CreatedAt = new DateTime(2026, 10, 22, 10, 0, 0, DateTimeKind.Utc)
            },
            new ExpenseTransaction
            {
                Id = 2,
                ExpenseNo = "EXP-2026-0097",
                ExpenseDate = new DateTime(2026, 10, 18, 0, 0, 0, DateTimeKind.Utc),
                Farmer = "Priya Sharma",
                Farm = "Lake Farm",
                Crop = "Cotton",
                CategoryId = 2,
                ExpenseCategory = "Labour",
                Supplier = "Village Labour Group",
                Description = "Weeding labour",
                Amount = 8400.00m,
                PaymentMode = "Cash",
                ReferenceNo = null,
                Remarks = "Field work weeding stage 1",
                Status = "Paid",
                CreatedAt = new DateTime(2026, 10, 18, 9, 30, 0, DateTimeKind.Utc)
            }
        );

        // 7. Seed Expense Items
        modelBuilder.Entity<ExpenseItem>().HasData(
            new ExpenseItem
            {
                Id = 1,
                ExpenseId = 1,
                ItemName = "Urea Fertilizer 50kg bag",
                Quantity = 10m,
                Unit = "bags",
                UnitPrice = 1100.00m,
                TotalAmount = 11000.00m,
                Remarks = "IFFCO Urea high quality",
                CreatedAt = new DateTime(2026, 10, 22, 10, 0, 0, DateTimeKind.Utc)
            },
            new ExpenseItem
            {
                Id = 2,
                ExpenseId = 1,
                ItemName = "Muriate of Potash (MOP) 50kg bag",
                Quantity = 5m,
                Unit = "bags",
                UnitPrice = 1500.00m,
                TotalAmount = 7500.00m,
                Remarks = "Potash basal dressing",
                CreatedAt = new DateTime(2026, 10, 22, 10, 0, 0, DateTimeKind.Utc)
            },
            new ExpenseItem
            {
                Id = 3,
                ExpenseId = 2,
                ItemName = "Manual Weeding Labour",
                Quantity = 21m,
                Unit = "man-days",
                UnitPrice = 400.00m,
                TotalAmount = 8400.00m,
                Remarks = "7 workers for 3 days weeding cotton field",
                CreatedAt = new DateTime(2026, 10, 18, 9, 30, 0, DateTimeKind.Utc)
            }
        );

        // 8. Seed Expense Payments
        modelBuilder.Entity<ExpensePayment>().HasData(
            new ExpensePayment
            {
                Id = 1,
                ExpenseId = 1,
                PaymentDate = new DateTime(2026, 10, 22, 10, 15, 0, DateTimeKind.Utc),
                PaymentMode = "Bank",
                Amount = 18500.00m,
                BankOrCash = "State Bank of India (Current A/c)",
                ReferenceNo = "UTR-09133",
                Status = "Completed",
                Remarks = "Direct RTGS/NEFT settlement to GreenGrow Supplies",
                CreatedAt = new DateTime(2026, 10, 22, 10, 15, 0, DateTimeKind.Utc)
            },
            new ExpensePayment
            {
                Id = 2,
                ExpenseId = 2,
                PaymentDate = new DateTime(2026, 10, 18, 17, 0, 0, DateTimeKind.Utc),
                PaymentMode = "Cash",
                Amount = 8400.00m,
                BankOrCash = "Cash in Hand",
                ReferenceNo = "CASH-VOUCHER-0097",
                Status = "Completed",
                Remarks = "Disbursed to labour group head",
                CreatedAt = new DateTime(2026, 10, 18, 17, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}
