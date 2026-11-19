using Microsoft.EntityFrameworkCore;
using FarmManagementApi.Models;

namespace FarmManagementApi.Data
{
    public class FarmDbContext : DbContext
    {
        public FarmDbContext(DbContextOptions<FarmDbContext> options) : base(options)
        {
        }

        // 1. Farmer, Profile & Land Holdings DbSets
        public DbSet<Farmer> Farmers => Set<Farmer>();
        public DbSet<FarmerAddress> FarmerAddresses => Set<FarmerAddress>();
        public DbSet<FarmerBankAccount> FarmerBankAccounts => Set<FarmerBankAccount>();
        public DbSet<Farm> Farms => Set<Farm>();
        public DbSet<FarmLandDetail> FarmLandDetails => Set<FarmLandDetail>();
        public DbSet<FarmDocument> FarmDocuments => Set<FarmDocument>();
        public DbSet<IrrigationSource> IrrigationSources => Set<IrrigationSource>();
        public DbSet<SoilType> SoilTypes => Set<SoilType>();

        // 2. Income Management DbSets
        public DbSet<IncomeCategory> IncomeCategories => Set<IncomeCategory>();
        public DbSet<IncomeTransaction> IncomeTransactions => Set<IncomeTransaction>();
        public DbSet<IncomeTransactionItem> IncomeTransactionItems => Set<IncomeTransactionItem>();
        public DbSet<IncomePayment> IncomePayments => Set<IncomePayment>();

        // 3. Purchase Management & Supplier DbSets
        public DbSet<Supplier> Suppliers => Set<Supplier>();
        public DbSet<SupplierTransaction> SupplierTransactions => Set<SupplierTransaction>();
        public DbSet<SupplierPayment> SupplierPayments => Set<SupplierPayment>();
        public DbSet<Purchase> Purchases => Set<Purchase>();
        public DbSet<PurchaseItem> PurchaseItems => Set<PurchaseItem>();
        public DbSet<PurchasePayment> PurchasePayments => Set<PurchasePayment>();

        // 4. Inventory & Agricultural Inputs DbSets
        public DbSet<ProductCategory> ProductCategories => Set<ProductCategory>();
        public DbSet<Units> Units => Set<Units>();
        public DbSet<Products> Products => Set<Products>();
        public DbSet<Inventory> Inventory => Set<Inventory>();
        public DbSet<InventoryTransaction> InventoryTransactions => Set<InventoryTransaction>();
        public DbSet<StockAdjustment> StockAdjustments => Set<StockAdjustment>();

        // 5. Labour Management DbSets
        public DbSet<Labour> Labours => Set<Labour>();
        public DbSet<LabourWorkType> LabourWorkTypes => Set<LabourWorkType>();
        public DbSet<LabourAttendance> LabourAttendances => Set<LabourAttendance>();
        public DbSet<LabourPayment> LabourPayments => Set<LabourPayment>();

        // 6. Crops & Seasons DbSets
        public DbSet<Crop> Crops => Set<Crop>();
        public DbSet<CropCategory> CropCategories => Set<CropCategory>();
        public DbSet<CropSeason> CropSeasons => Set<CropSeason>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ==========================================
            // Farmers table
            // ==========================================
            modelBuilder.Entity<Farmer>(entity =>
            {
                entity.ToTable("farmers");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.FarmerCode).IsUnique();
                entity.Property(e => e.FarmerCode).HasMaxLength(50).IsRequired();
                entity.Property(e => e.FarmerName).HasMaxLength(150).IsRequired();
                entity.Property(e => e.Mobile).HasMaxLength(20).IsRequired();
                entity.Property(e => e.TotalLand).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Active");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

                // 1-to-1 relationship with Address
                entity.HasOne(f => f.Address)
                      .WithOne(a => a.Farmer)
                      .HasForeignKey<FarmerAddress>(a => a.FarmerId)
                      .OnDelete(DeleteBehavior.Cascade);

                // 1-to-1 relationship with Bank Account
                entity.HasOne(f => f.BankAccount)
                      .WithOne(b => b.Farmer)
                      .HasForeignKey<FarmerBankAccount>(b => b.FarmerId)
                      .OnDelete(DeleteBehavior.Cascade);

                // 1-to-many relationship with Farms
                entity.HasMany(f => f.Farms)
                      .WithOne(farm => farm.Farmer)
                      .HasForeignKey(farm => farm.FarmerId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ==========================================
            // Farmer Addresses table
            // ==========================================
            modelBuilder.Entity<FarmerAddress>(entity =>
            {
                entity.ToTable("farmer_addresses");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.FarmerId).IsUnique();
                entity.Property(e => e.Village).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Mandal).HasMaxLength(100).IsRequired();
                entity.Property(e => e.District).HasMaxLength(100).IsRequired();
                entity.Property(e => e.State).HasMaxLength(100).IsRequired();
                entity.Property(e => e.PinCode).HasMaxLength(10).IsRequired();
            });

            // ==========================================
            // Farmer Bank Accounts table
            // ==========================================
            modelBuilder.Entity<FarmerBankAccount>(entity =>
            {
                entity.ToTable("farmer_bank_accounts");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.FarmerId).IsUnique();
                entity.Property(e => e.BankName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.AccountNumber).HasMaxLength(50).IsRequired();
                entity.Property(e => e.IFSC).HasMaxLength(20).IsRequired();
            });

            // ==========================================
            // Irrigation Sources Table
            // ==========================================
            modelBuilder.Entity<IrrigationSource>(entity =>
            {
                entity.ToTable("irrigation_sources");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.Name).IsUnique();

                entity.HasData(
                    new IrrigationSource { Id = 1, Name = "Borewell", Description = "Groundwater deep borewell extraction", IsActive = true },
                    new IrrigationSource { Id = 2, Name = "Canal", Description = "Government canal gravity irrigation", IsActive = true },
                    new IrrigationSource { Id = 3, Name = "Drip", Description = "Precision drip micro-irrigation system", IsActive = true },
                    new IrrigationSource { Id = 4, Name = "Rain-fed", Description = "Monsoon seasonal rain-fed cultivation", IsActive = true },
                    new IrrigationSource { Id = 5, Name = "Sprinkler", Description = "Overhead sprinkler distribution", IsActive = true },
                    new IrrigationSource { Id = 6, Name = "River Lift", Description = "Lift irrigation from perennial river", IsActive = true }
                );
            });

            // ==========================================
            // Soil Types Table
            // ==========================================
            modelBuilder.Entity<SoilType>(entity =>
            {
                entity.ToTable("soil_types");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.Name).IsUnique();

                entity.HasData(
                    new SoilType { Id = 1, Name = "Black Soil", Description = "High clay content cotton soil", IsActive = true },
                    new SoilType { Id = 2, Name = "Red Soil", Description = "Iron-rich porous agricultural soil", IsActive = true },
                    new SoilType { Id = 3, Name = "Alluvial Soil", Description = "River basin highly fertile silt soil", IsActive = true },
                    new SoilType { Id = 4, Name = "Clay Loam", Description = "Balanced moisture-retaining loam", IsActive = true },
                    new SoilType { Id = 5, Name = "Sandy Loam", Description = "Fast-draining sandy loam soil", IsActive = true },
                    new SoilType { Id = 6, Name = "Laterite Soil", Description = "Acidic high rainfall region soil", IsActive = true }
                );
            });

            // ==========================================
            // Farms Table
            // ==========================================
            modelBuilder.Entity<Farm>(entity =>
            {
                entity.ToTable("farms");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FarmName).IsRequired().HasMaxLength(150);
                entity.Property(e => e.OwnershipType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Village).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Mandal).IsRequired().HasMaxLength(100);
                entity.Property(e => e.District).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("Active");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.Farmer)
                      .WithMany(f => f.Farms)
                      .HasForeignKey(e => e.FarmerId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ==========================================
            // Farm Land Details Table
            // ==========================================
            modelBuilder.Entity<FarmLandDetail>(entity =>
            {
                entity.ToTable("farm_land_details");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.SurveyNumber).IsRequired().HasMaxLength(100);
                entity.Property(e => e.LandArea).HasPrecision(18, 2);
                entity.Property(e => e.AreaUnit).IsRequired().HasMaxLength(50);
                entity.Property(e => e.LandType).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.Farm)
                      .WithMany(f => f.LandDetails)
                      .HasForeignKey(e => e.FarmId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.IrrigationSource)
                      .WithMany(i => i.FarmLandDetails)
                      .HasForeignKey(e => e.IrrigationSourceId)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.SoilType)
                      .WithMany(s => s.FarmLandDetails)
                      .HasForeignKey(e => e.SoilTypeId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // ==========================================
            // Farm Documents Table
            // ==========================================
            modelBuilder.Entity<FarmDocument>(entity =>
            {
                entity.ToTable("farm_documents");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.DocumentType).IsRequired().HasMaxLength(100);
                entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.UploadedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.Farm)
                  .WithMany(f => f.Documents)
                  .HasForeignKey(e => e.FarmId)
                  .OnDelete(DeleteBehavior.Cascade);
            });

            // ==========================================
            // Income Categories table
            // ==========================================
            modelBuilder.Entity<IncomeCategory>(entity =>
            {
                entity.ToTable("income_categories");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(250);
                entity.Property(e => e.IsActive).HasDefaultValue(true);

                // Seed predefined income categories
                entity.HasData(
                    new IncomeCategory { Id = 1, Name = "Crop Sales", IsActive = true },
                    new IncomeCategory { Id = 2, Name = "Milk Sales", IsActive = true },
                    new IncomeCategory { Id = 3, Name = "Animal Sales", IsActive = true },
                    new IncomeCategory { Id = 4, Name = "Government Subsidy", IsActive = true },
                    new IncomeCategory { Id = 5, Name = "Loan Received", IsActive = true },
                    new IncomeCategory { Id = 6, Name = "Rental Income", IsActive = true },
                    new IncomeCategory { Id = 7, Name = "Other Income", IsActive = true }
                );
            });

            // ==========================================
            // Income Transactions table
            // ==========================================
            modelBuilder.Entity<IncomeTransaction>(entity =>
            {
                entity.ToTable("income_transactions");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.IncomeNo).IsUnique();
                entity.Property(e => e.IncomeNo).HasMaxLength(50).IsRequired();
                entity.Property(e => e.IncomeDate).IsRequired();

                entity.Property(e => e.Farm).HasMaxLength(150).IsRequired();
                entity.Property(e => e.Crop).HasMaxLength(100);
                entity.Property(e => e.Buyer).HasMaxLength(150).IsRequired();

                entity.Property(e => e.GrossAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Discount).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.OtherCharges).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.NetAmount).HasColumnType("decimal(18,2)");

                entity.Property(e => e.Status).HasMaxLength(30).HasDefaultValue("Completed");
                entity.Property(e => e.Remarks).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(t => t.Category)
                      .WithMany(c => c.Transactions)
                      .HasForeignKey(t => t.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(t => t.Farmer)
                      .WithMany()
                      .HasForeignKey(t => t.FarmerId)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasMany(t => t.Items)
                      .WithOne(i => i.Transaction)
                      .HasForeignKey(i => i.TransactionId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(t => t.Payments)
                      .WithOne(p => p.Transaction)
                      .HasForeignKey(p => p.TransactionId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ==========================================
            // Income Transaction Items table
            // ==========================================
            modelBuilder.Entity<IncomeTransactionItem>(entity =>
            {
                entity.ToTable("income_transaction_items");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ItemName).HasMaxLength(150);
                entity.Property(e => e.Quantity).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Unit).HasMaxLength(30).IsRequired();
                entity.Property(e => e.Rate).HasColumnType("decimal(18,2)");
                entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
            });

            // ==========================================
            // Income Payments table
            // ==========================================
            modelBuilder.Entity<IncomePayment>(entity =>
            {
                entity.ToTable("income_payments");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.PaymentMode).HasMaxLength(50).IsRequired();
                entity.Property(e => e.BankOrCash).HasMaxLength(100);
                entity.Property(e => e.ReferenceNumber).HasMaxLength(100);
                entity.Property(e => e.PaymentDate).HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // ==========================================
            // Suppliers table
            // ==========================================
            modelBuilder.Entity<Supplier>(entity =>
            {
                entity.ToTable("suppliers");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.SupplierCode).HasColumnName("supplier_code").HasMaxLength(50);
                entity.Property(e => e.SupplierName).HasColumnName("supplier_name").HasMaxLength(150);
                entity.Property(e => e.SupplierType).HasColumnName("supplier_type").HasMaxLength(100);
                entity.Property(e => e.Mobile).HasColumnName("mobile").HasMaxLength(15);
                entity.Property(e => e.Name).HasColumnName("Name").HasMaxLength(150);
                entity.Property(e => e.ContactPerson).HasColumnName("ContactPerson").HasMaxLength(100);
                entity.Property(e => e.Phone).HasColumnName("Phone").HasMaxLength(20);
                entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(120);
                entity.Property(e => e.Address).HasColumnName("address");
                entity.Property(e => e.GstNumber).HasColumnName("GstNumber").HasMaxLength(50);
                entity.Property(e => e.City).HasColumnName("city").HasMaxLength(100);
                entity.Property(e => e.District).HasColumnName("district").HasMaxLength(100);
                entity.Property(e => e.State).HasColumnName("state").HasMaxLength(100);
                entity.Property(e => e.PinCode).HasColumnName("pin_code").HasMaxLength(10);
                entity.Property(e => e.Gstin).HasColumnName("gstin").HasMaxLength(20);
                entity.Property(e => e.BankName).HasColumnName("bank_name").HasMaxLength(120);
                entity.Property(e => e.AccountNumber).HasColumnName("account_number").HasMaxLength(50);
                entity.Property(e => e.IfscCode).HasColumnName("ifsc_code").HasMaxLength(20);
                entity.Property(e => e.BranchName).HasColumnName("branch_name").HasMaxLength(100);
                entity.Property(e => e.OpeningBalance).HasColumnName("opening_balance").HasColumnType("decimal(12,2)").HasDefaultValue(0m);
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).HasDefaultValue("Active");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(s => s.Farmer)
                      .WithMany(f => f.Suppliers)
                      .HasForeignKey(s => s.FarmerId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(s => s.Transactions)
                      .WithOne(t => t.Supplier)
                      .HasForeignKey(t => t.SupplierId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(s => s.Payments)
                      .WithOne(p => p.Supplier)
                      .HasForeignKey(p => p.SupplierId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ==========================================
            // Supplier Transactions table
            // ==========================================
            modelBuilder.Entity<SupplierTransaction>(entity =>
            {
                entity.ToTable("supplier_transactions");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TransactionCode).HasColumnName("transaction_code").HasMaxLength(50).IsRequired();
                entity.Property(e => e.TransactionDate).HasColumnName("transaction_date").IsRequired();
                entity.Property(e => e.SupplierId).HasColumnName("supplier_id").IsRequired();
                entity.Property(e => e.SupplierName).HasColumnName("supplier_name").HasMaxLength(150).IsRequired();
                entity.Property(e => e.TransactionType).HasColumnName("transaction_type").HasMaxLength(50).HasDefaultValue("Purchase");
                entity.Property(e => e.ReferenceNo).HasColumnName("reference_no").HasMaxLength(100);
                entity.Property(e => e.Category).HasColumnName("category").HasMaxLength(100);
                entity.Property(e => e.ItemsSummary).HasColumnName("items_summary");
                entity.Property(e => e.Amount).HasColumnName("amount").HasColumnType("decimal(12,2)").HasDefaultValue(0m);
                entity.Property(e => e.PaidAmount).HasColumnName("paid_amount").HasColumnType("decimal(12,2)").HasDefaultValue(0m);
                entity.Property(e => e.BalanceAmount).HasColumnName("balance_amount").HasColumnType("decimal(12,2)").HasDefaultValue(0m);
                entity.Property(e => e.PaymentStatus).HasColumnName("payment_status").HasMaxLength(50).HasDefaultValue("Pending");
                entity.Property(e => e.Notes).HasColumnName("notes");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // ==========================================
            // Supplier Payments table
            // ==========================================
            modelBuilder.Entity<SupplierPayment>(entity =>
            {
                entity.ToTable("supplier_payments");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PaymentCode).HasColumnName("payment_code").HasMaxLength(50).IsRequired();
                entity.Property(e => e.PaymentDate).HasColumnName("payment_date").IsRequired();
                entity.Property(e => e.SupplierId).HasColumnName("supplier_id").IsRequired();
                entity.Property(e => e.SupplierName).HasColumnName("supplier_name").HasMaxLength(150).IsRequired();
                entity.Property(e => e.AmountPaid).HasColumnName("amount_paid").HasColumnType("decimal(12,2)").IsRequired();
                entity.Property(e => e.PaymentMode).HasColumnName("payment_mode").HasMaxLength(50).HasDefaultValue("Bank Transfer");
                entity.Property(e => e.ReferenceNo).HasColumnName("reference_no").HasMaxLength(100);
                entity.Property(e => e.BankAccount).HasColumnName("bank_account").HasMaxLength(120);
                entity.Property(e => e.Notes).HasColumnName("notes");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // ==========================================
            // Purchases table
            // ==========================================
            modelBuilder.Entity<Purchase>(entity =>
            {
                entity.ToTable("purchases");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.PurchaseNo).IsUnique();
                entity.Property(e => e.PurchaseNo).HasMaxLength(50).IsRequired();
                entity.Property(e => e.PurchaseDate).IsRequired();

                entity.Property(e => e.SubTotal).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.TaxAmount).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.PaidAmount).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.BalanceAmount).HasColumnType("decimal(18,2)").HasDefaultValue(0);

                entity.Property(e => e.PaymentStatus).HasMaxLength(30).HasDefaultValue("Pending");
                entity.Property(e => e.Notes).HasMaxLength(500);

                entity.HasOne(p => p.Farmer)
                      .WithMany(f => f.Purchases)
                      .HasForeignKey(p => p.FarmerId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(p => p.Supplier)
                      .WithMany(s => s.Purchases)
                      .HasForeignKey(p => p.SupplierId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(p => p.Items)
                      .WithOne(i => i.Purchase)
                      .HasForeignKey(i => i.PurchaseId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(p => p.Payments)
                      .WithOne(pay => pay.Purchase)
                      .HasForeignKey(pay => pay.PurchaseId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ==========================================
            // Purchase Items table
            // ==========================================
            modelBuilder.Entity<PurchaseItem>(entity =>
            {
                entity.ToTable("purchase_items");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ProductName).HasMaxLength(150).IsRequired();
                entity.Property(e => e.Unit).HasMaxLength(30);
                entity.Property(e => e.Quantity).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Rate).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Discount).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.TaxRate).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.Total).HasColumnType("decimal(18,2)");
            });

            // ==========================================
            // Purchase Payments table
            // ==========================================
            modelBuilder.Entity<PurchasePayment>(entity =>
            {
                entity.ToTable("purchase_payments");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.PaymentMode).HasMaxLength(50).IsRequired();
                entity.Property(e => e.BankOrCash).HasMaxLength(100);
                entity.Property(e => e.ReferenceNumber).HasMaxLength(100);
                entity.Property(e => e.PaymentDate).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.Notes).HasMaxLength(500);
            });

            // ==========================================
            // Product Categories table
            // ==========================================
            modelBuilder.Entity<ProductCategory>(entity =>
            {
                entity.ToTable("product_categories");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(250);
                entity.Property(e => e.IsActive).HasDefaultValue(true);

                // Seed predefined agricultural input categories
                entity.HasData(
                    new ProductCategory { Id = 1, Name = "Seeds", Description = "Agricultural seeds and saplings", IsActive = true },
                    new ProductCategory { Id = 2, Name = "Fertilizers", Description = "Organic and chemical fertilizers", IsActive = true },
                    new ProductCategory { Id = 3, Name = "Pesticides", Description = "Insecticides, fungicides, and weedicides", IsActive = true },
                    new ProductCategory { Id = 4, Name = "Sprayer chemicals", Description = "Special spray formulations and micronutrients", IsActive = true },
                    new ProductCategory { Id = 5, Name = "Spare parts", Description = "Tractor, motor, and farm machinery spares", IsActive = true },
                    new ProductCategory { Id = 6, Name = "Other consumables", Description = "Pipes, ropes, tarpaulins, and farm tools", IsActive = true }
                );
            });

            // ==========================================
            // Units table
            // ==========================================
            modelBuilder.Entity<Units>(entity =>
            {
                entity.ToTable("units");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).HasMaxLength(50).IsRequired();
                entity.Property(e => e.ShortCode).HasMaxLength(20).IsRequired();
                entity.Property(e => e.IsActive).HasDefaultValue(true);

                // Seed predefined units
                entity.HasData(
                    new Units { Id = 1, Name = "Kilograms", ShortCode = "kg", IsActive = true },
                    new Units { Id = 2, Name = "Grams", ShortCode = "g", IsActive = true },
                    new Units { Id = 3, Name = "Litres", ShortCode = "L", IsActive = true },
                    new Units { Id = 4, Name = "Millilitres", ShortCode = "ml", IsActive = true },
                    new Units { Id = 5, Name = "Bags", ShortCode = "bag", IsActive = true },
                    new Units { Id = 6, Name = "Packets", ShortCode = "pkt", IsActive = true },
                    new Units { Id = 7, Name = "Bottles", ShortCode = "btl", IsActive = true },
                    new Units { Id = 8, Name = "Pieces / Numbers", ShortCode = "nos", IsActive = true }
                );
            });

            // ==========================================
            // Products table
            // ==========================================
            modelBuilder.Entity<Products>(entity =>
            {
                entity.ToTable("products");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Code).IsUnique();
                entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Name).HasMaxLength(150).IsRequired();
                entity.Property(e => e.ReorderLevel).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.StandardCost).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.IsActive).HasDefaultValue(true);

                // Relationship: Category -> Products
                entity.HasOne(p => p.Category)
                      .WithMany()
                      .HasForeignKey(p => p.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Relationship: Units -> Products
                entity.HasOne(p => p.Units)
                      .WithMany()
                      .HasForeignKey(p => p.UnitId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ==========================================
            // Inventory table
            // ==========================================
            modelBuilder.Entity<Inventory>(entity =>
            {
                entity.ToTable("inventory");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.ProductId, e.StorageLocation }).IsUnique();
                entity.Property(e => e.StorageLocation).HasMaxLength(100).HasDefaultValue("Main Warehouse").IsRequired();
                entity.Property(e => e.CurrentStock).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.ReservedStock).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.LastUpdated).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(i => i.Product)
                      .WithMany()
                      .HasForeignKey(i => i.ProductId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ==========================================
            // Inventory Transactions table (Ledger)
            // ==========================================
            modelBuilder.Entity<InventoryTransaction>(entity =>
            {
                entity.ToTable("inventory_transactions");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TransactionDate).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.TransactionType).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Quantity).HasColumnType("decimal(18,2)");
                entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.StorageLocation).HasMaxLength(100).IsRequired();
                entity.Property(e => e.ReferenceType).HasMaxLength(50);
                entity.Property(e => e.ReferenceNumber).HasMaxLength(100);
                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.BalanceAfterTransaction).HasColumnType("decimal(18,2)");

                // Relationship: Product -> InventoryTransactions
                entity.HasOne(t => t.Product)
                      .WithMany()
                      .HasForeignKey(t => t.ProductId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ==========================================
            // Stock Adjustments table
            // ==========================================
            modelBuilder.Entity<StockAdjustment>(entity =>
            {
                entity.ToTable("stock_adjustments");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.AdjustmentNumber).IsUnique();
                entity.Property(e => e.AdjustmentNumber).HasMaxLength(50).IsRequired();
                entity.Property(e => e.AdjustmentDate).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.StorageLocation).HasMaxLength(100).HasDefaultValue("Main Warehouse").IsRequired();
                entity.Property(e => e.BookStock).HasColumnType("decimal(18,2)");
                entity.Property(e => e.PhysicalStock).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Reason).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Remarks).HasMaxLength(500);

                // Relationship: Product -> StockAdjustments
                entity.HasOne(a => a.Product)
                      .WithMany()
                      .HasForeignKey(a => a.ProductId)
                      .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
