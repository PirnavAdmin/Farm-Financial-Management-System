using Microsoft.EntityFrameworkCore;
using SalesApi.Models;

namespace SalesApi.Data;

public class SalesDbContext : DbContext
{
    public SalesDbContext(DbContextOptions<SalesDbContext> options) : base(options)
    {
    }

    public DbSet<Sale> Sales { get; set; } = null!;

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
    }
}
