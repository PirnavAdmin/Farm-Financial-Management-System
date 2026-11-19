using Microsoft.EntityFrameworkCore;
using SalesApi.Models;

namespace SalesApi.Data;

public class SalesDbContext : DbContext
{
    public SalesDbContext(DbContextOptions<SalesDbContext> options) : base(options)
    {
    }

    public DbSet<Sale> Sales { get; set; } = null!;
    public DbSet<SalesItem> SalesItems { get; set; } = null!;
    public DbSet<SalesPayment> SalesPayments { get; set; } = null!;
    public DbSet<Buyer> Buyers { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Sale>(entity =>
        {
            entity.ToTable("Sales");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.SalesNo)
                  .IsRequired()
                  .HasMaxLength(50);

            entity.Property(e => e.SalesDate)
                  .IsRequired();

            entity.Property(e => e.Buyer)
                  .IsRequired()
                  .HasMaxLength(150);

            entity.Property(e => e.Farm)
                  .IsRequired()
                  .HasMaxLength(150);

            entity.Property(e => e.Crop)
                  .IsRequired()
                  .HasMaxLength(100);

            entity.Property(e => e.Quantity)
                  .HasPrecision(18, 2)
                  .IsRequired();

            entity.Property(e => e.Unit)
                  .IsRequired()
                  .HasMaxLength(20)
                  .HasDefaultValue("kg");

            entity.Property(e => e.Rate)
                  .HasPrecision(18, 2)
                  .IsRequired();

            entity.Property(e => e.GrossAmount)
                  .HasPrecision(18, 2)
                  .IsRequired();

            entity.Property(e => e.Commission)
                  .HasPrecision(18, 2)
                  .HasDefaultValue(0);

            entity.Property(e => e.Transport)
                  .HasPrecision(18, 2)
                  .HasDefaultValue(0);

            entity.Property(e => e.NetAmount)
                  .HasPrecision(18, 2)
                  .IsRequired();

            entity.Property(e => e.PaymentStatus)
                  .IsRequired()
                  .HasMaxLength(30)
                  .HasDefaultValue("Pending");

            entity.Property(e => e.CreatedAt)
                  .IsRequired();

            entity.Property(e => e.UpdatedAt);
        });

        modelBuilder.Entity<SalesItem>(entity =>
        {
            entity.ToTable("SalesItems");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SalesNo).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Crop).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Quantity).HasPrecision(18, 2).IsRequired();
            entity.Property(e => e.Unit).IsRequired().HasMaxLength(20).HasDefaultValue("kg");
            entity.Property(e => e.Rate).HasPrecision(18, 2).IsRequired();
            entity.Property(e => e.Amount).HasPrecision(18, 2).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
        });

        modelBuilder.Entity<SalesPayment>(entity =>
        {
            entity.ToTable("SalesPayments");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PaymentNo).IsRequired().HasMaxLength(50);
            entity.Property(e => e.PaymentDate).IsRequired();
            entity.Property(e => e.Buyer).IsRequired().HasMaxLength(150);
            entity.Property(e => e.SalesNo).IsRequired().HasMaxLength(50);
            entity.Property(e => e.PaymentAmount).HasPrecision(18, 2).IsRequired();
            entity.Property(e => e.PaymentMode).IsRequired().HasMaxLength(30).HasDefaultValue("Bank");
            entity.Property(e => e.ReferenceNo).HasMaxLength(100);
            entity.Property(e => e.Remarks).HasMaxLength(255);
            entity.Property(e => e.CreatedAt).IsRequired();
        });

        modelBuilder.Entity<Buyer>(entity =>
        {
            entity.ToTable("Buyers");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.BuyerCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.BuyerName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.Mobile).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Address).HasMaxLength(255);
            entity.Property(e => e.BusinessName).HasMaxLength(150);
            entity.Property(e => e.Gstin).HasMaxLength(30);
            entity.Property(e => e.OpeningBalance).HasPrecision(18, 2).HasDefaultValue(0);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("Active");
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt);
        });
    }
}
