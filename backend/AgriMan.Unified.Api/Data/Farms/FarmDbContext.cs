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
        public DbSet<CropVariety> CropVarieties => Set<CropVariety>();
        public DbSet<CropActivity> CropActivities => Set<CropActivity>();

        // 7. Loans & Finance DbSets
        public DbSet<Loan> Loans => Set<Loan>();
        public DbSet<LoanDisbursement> LoanDisbursements => Set<LoanDisbursement>();
        public DbSet<LoanInstallment> LoanInstallments => Set<LoanInstallment>();
        public DbSet<LoanPayment> LoanPayments => Set<LoanPayment>();
        public DbSet<LoanDocument> LoanDocuments => Set<LoanDocument>();
        public DbSet<BankAccount> BankAccounts => Set<BankAccount>();
        public DbSet<FinancePayment> FinancePayments => Set<FinancePayment>();
        public DbSet<FinanceReceipt> FinanceReceipts => Set<FinanceReceipt>();

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

                // Seed predefined income categories (static CreatedAt keeps EF model snapshot deterministic)
                var seedCreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                entity.HasData(
                    new IncomeCategory { Id = 1, Code = "INC-CAT-1", Name = "Crop Sales", IsActive = true, Status = "Active", CreatedAt = seedCreatedAt },
                    new IncomeCategory { Id = 2, Code = "INC-CAT-2", Name = "Milk Sales", IsActive = true, Status = "Active", CreatedAt = seedCreatedAt },
                    new IncomeCategory { Id = 3, Code = "INC-CAT-3", Name = "Animal Sales", IsActive = true, Status = "Active", CreatedAt = seedCreatedAt },
                    new IncomeCategory { Id = 4, Code = "INC-CAT-4", Name = "Government Subsidy", IsActive = true, Status = "Active", CreatedAt = seedCreatedAt },
                    new IncomeCategory { Id = 5, Code = "INC-CAT-5", Name = "Loan Received", IsActive = true, Status = "Active", CreatedAt = seedCreatedAt },
                    new IncomeCategory { Id = 6, Code = "INC-CAT-6", Name = "Rental Income", IsActive = true, Status = "Active", CreatedAt = seedCreatedAt },
                    new IncomeCategory { Id = 7, Code = "INC-CAT-7", Name = "Other Income", IsActive = true, Status = "Active", CreatedAt = seedCreatedAt }
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
                entity.Property(e => e.Reason).HasMaxLength(250).IsRequired();
                entity.Property(e => e.Remarks).HasMaxLength(500);
                entity.Property(e => e.AdjustmentType).HasMaxLength(50);
                entity.Property(e => e.ApprovedBy).HasMaxLength(100);

                // Relationship: Product -> StockAdjustments
                entity.HasOne(a => a.Product)
                      .WithMany()
                      .HasForeignKey(a => a.ProductId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ==========================================
            // Loans table
            // ==========================================
            modelBuilder.Entity<Loan>(entity =>
            {
                entity.ToTable("loans");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.LoanNo).IsUnique();
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.BankLender);

                entity.HasMany(l => l.Disbursements)
                      .WithOne(d => d.Loan)
                      .HasForeignKey(d => d.LoanId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(l => l.Installments)
                      .WithOne(i => i.Loan)
                      .HasForeignKey(i => i.LoanId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(l => l.Payments)
                      .WithOne(p => p.Loan)
                      .HasForeignKey(p => p.LoanId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(l => l.Documents)
                      .WithOne(doc => doc.Loan)
                      .HasForeignKey(doc => doc.LoanId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ==========================================
            // Loan Disbursements table
            // ==========================================
            modelBuilder.Entity<LoanDisbursement>(entity =>
            {
                entity.ToTable("loan_disbursements");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.DisbursementNo).IsUnique();
                entity.HasIndex(e => e.LoanId);
            });

            // ==========================================
            // Loan Installments table
            // ==========================================
            modelBuilder.Entity<LoanInstallment>(entity =>
            {
                entity.ToTable("loan_installments");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.LoanId, e.InstallmentNumber });
                entity.HasIndex(e => e.DueDate);
                entity.HasIndex(e => e.Status);
            });

            // ==========================================
            // Loan Payments table
            // ==========================================
            modelBuilder.Entity<LoanPayment>(entity =>
            {
                entity.ToTable("loan_payments");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.VoucherNo).IsUnique();
                entity.HasIndex(e => e.LoanId);
                entity.HasIndex(e => e.PaymentDate);
            });

            // ==========================================
            // Loan Documents table
            // ==========================================
            modelBuilder.Entity<LoanDocument>(entity =>
            {
                entity.ToTable("loan_documents");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.LoanId);
            });

            // ==========================================
            // Module 5: Crop Varieties & Crop Activities
            // ==========================================
            modelBuilder.Entity<CropVariety>(entity =>
            {
                entity.ToTable("crop_varieties");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Code);
                entity.HasIndex(e => e.CropId);
            });

            modelBuilder.Entity<CropActivity>(entity =>
            {
                entity.ToTable("crop_activities");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.ActivityCode);
                entity.HasIndex(e => e.FarmId);
                entity.HasIndex(e => e.CropId);
                entity.HasIndex(e => e.SeasonId);
            });

            // ==========================================
            // Module 11: Bank Accounts, Payments & Receipts
            // ==========================================
            modelBuilder.Entity<BankAccount>(entity =>
            {
                entity.ToTable("bank_accounts");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.AccountName);
            });

            modelBuilder.Entity<FinancePayment>(entity =>
            {
                entity.ToTable("finance_payments");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.PaymentNo).IsUnique();
                entity.HasIndex(e => e.Date);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.PaymentMode);
                entity.Property(e => e.OriginalAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.OutstandingAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.AdditionalCharges).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Discount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
            });

            modelBuilder.Entity<FinanceReceipt>(entity =>
            {
                entity.ToTable("finance_receipts");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.ReceiptNo).IsUnique();
                entity.HasIndex(e => e.Date);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.PaymentMode);
                entity.Property(e => e.OriginalAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.OutstandingAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Discount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.OtherCharges).HasColumnType("decimal(18,2)");
                entity.Property(e => e.FinalAmount).HasColumnType("decimal(18,2)");
            });
        }

        public static async Task EnsureLoanTablesCreatedAsync(FarmDbContext context)
        {
            try
            {
                var sql = @"
CREATE TABLE IF NOT EXISTS `loans` (
    `Id` INT NOT NULL AUTO_INCREMENT,
    `LoanNo` VARCHAR(50) NOT NULL,
    `LoanAccountNo` VARCHAR(100) NULL,
    `BankLender` VARCHAR(150) NOT NULL,
    `LoanType` VARCHAR(100) NOT NULL,
    `LoanPurpose` VARCHAR(500) NULL,
    `SanctionAmount` DECIMAL(18,2) NOT NULL,
    `DisbursedAmount` DECIMAL(18,2) NOT NULL,
    `OutstandingPrincipal` DECIMAL(18,2) NOT NULL,
    `InterestRate` DECIMAL(5,2) NOT NULL,
    `InterestType` VARCHAR(20) NOT NULL DEFAULT 'Fixed',
    `TenureMonths` INT NOT NULL DEFAULT 12,
    `RepaymentFrequency` VARCHAR(30) NOT NULL DEFAULT 'Monthly',
    `EmiAmount` DECIMAL(18,2) NOT NULL,
    `StartDate` DATETIME NOT NULL,
    `EndDate` DATETIME NOT NULL,
    `NextEmiDueDate` DATETIME NULL,
    `ProcessingFees` DECIMAL(18,2) NOT NULL DEFAULT 0,
    `Status` VARCHAR(30) NOT NULL DEFAULT 'Active',
    `Remarks` VARCHAR(500) NULL,
    `ClosedDate` DATETIME NULL,
    `ClosureCertificateUrl` VARCHAR(500) NULL,
    `ClosureRemarks` VARCHAR(500) NULL,
    `FarmerId` INT NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME NULL,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `UX_loans_LoanNo` (`LoanNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `loan_disbursements` (
    `Id` INT NOT NULL AUTO_INCREMENT,
    `LoanId` INT NOT NULL,
    `DisbursementNo` VARCHAR(50) NOT NULL,
    `DisbursementDate` DATETIME NOT NULL,
    `DisbursedAmount` DECIMAL(18,2) NOT NULL,
    `BankAccount` VARCHAR(150) NULL,
    `ReferenceNo` VARCHAR(100) NULL,
    `Remarks` VARCHAR(500) NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `UX_loan_disbursements_DisbursementNo` (`DisbursementNo`),
    KEY `IX_loan_disbursements_LoanId` (`LoanId`),
    CONSTRAINT `FK_loan_disbursements_loans` FOREIGN KEY (`LoanId`) REFERENCES `loans` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `loan_installments` (
    `Id` INT NOT NULL AUTO_INCREMENT,
    `LoanId` INT NOT NULL,
    `InstallmentNumber` INT NOT NULL,
    `DueDate` DATETIME NOT NULL,
    `OpeningPrincipal` DECIMAL(18,2) NOT NULL,
    `PrincipalAmount` DECIMAL(18,2) NOT NULL,
    `InterestAmount` DECIMAL(18,2) NOT NULL,
    `EmiAmount` DECIMAL(18,2) NOT NULL,
    `PaidAmount` DECIMAL(18,2) NOT NULL DEFAULT 0,
    `RemainingAmount` DECIMAL(18,2) NOT NULL,
    `ClosingPrincipal` DECIMAL(18,2) NOT NULL,
    `Status` VARCHAR(30) NOT NULL DEFAULT 'Pending',
    `PaidDate` DATETIME NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`Id`),
    KEY `IX_loan_installments_LoanId` (`LoanId`),
    KEY `IX_loan_installments_DueDate` (`DueDate`),
    KEY `IX_loan_installments_Status` (`Status`),
    CONSTRAINT `FK_loan_installments_loans` FOREIGN KEY (`LoanId`) REFERENCES `loans` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `loan_payments` (
    `Id` INT NOT NULL AUTO_INCREMENT,
    `LoanId` INT NOT NULL,
    `VoucherNo` VARCHAR(50) NOT NULL,
    `PaymentDate` DATETIME NOT NULL,
    `InstallmentNumber` INT NULL,
    `Principal` DECIMAL(18,2) NOT NULL,
    `Interest` DECIMAL(18,2) NOT NULL,
    `Penalty` DECIMAL(18,2) NOT NULL DEFAULT 0,
    `TotalPayment` DECIMAL(18,2) NOT NULL,
    `PaymentMode` VARCHAR(50) NOT NULL,
    `ReferenceNo` VARCHAR(100) NULL,
    `Remarks` VARCHAR(500) NULL,
    `PaymentType` VARCHAR(50) NOT NULL DEFAULT 'Regular EMI',
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `UX_loan_payments_VoucherNo` (`VoucherNo`),
    KEY `IX_loan_payments_LoanId` (`LoanId`),
    KEY `IX_loan_payments_PaymentDate` (`PaymentDate`),
    CONSTRAINT `FK_loan_payments_loans` FOREIGN KEY (`LoanId`) REFERENCES `loans` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `loan_documents` (
    `Id` INT NOT NULL AUTO_INCREMENT,
    `LoanId` INT NOT NULL,
    `DocumentName` VARCHAR(200) NOT NULL,
    `DocumentType` VARCHAR(100) NOT NULL,
    `FileUrl` VARCHAR(500) NOT NULL,
    `UploadedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`Id`),
    KEY `IX_loan_documents_LoanId` (`LoanId`),
    CONSTRAINT `FK_loan_documents_loans` FOREIGN KEY (`LoanId`) REFERENCES `loans` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `crop_varieties` (
    `Id` INT NOT NULL AUTO_INCREMENT,
    `Code` VARCHAR(50) NOT NULL,
    `CropId` INT NULL,
    `CropName` VARCHAR(150) NOT NULL,
    `VarietyName` VARCHAR(150) NOT NULL,
    `DurationDays` INT NOT NULL DEFAULT 120,
    `Season` VARCHAR(50) NOT NULL DEFAULT 'Kharif',
    `ExpectedYield` VARCHAR(100) NULL,
    `Status` VARCHAR(30) NOT NULL DEFAULT 'Active',
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`Id`),
    KEY `IX_crop_varieties_Code` (`Code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `crop_activities` (
    `Id` INT NOT NULL AUTO_INCREMENT,
    `ActivityCode` VARCHAR(50) NOT NULL,
    `FarmId` INT NULL,
    `Farm` VARCHAR(150) NOT NULL,
    `CropId` INT NULL,
    `Crop` VARCHAR(150) NOT NULL,
    `SeasonId` INT NULL,
    `Season` VARCHAR(100) NOT NULL,
    `ActivityType` VARCHAR(100) NOT NULL,
    `ActivityDate` DATETIME NOT NULL,
    `LabourWorkers` VARCHAR(150) NULL,
    `Machinery` VARCHAR(150) NULL,
    `MaterialsUsed` VARCHAR(300) NULL,
    `TotalCost` DECIMAL(18,2) NOT NULL DEFAULT 0,
    `Status` VARCHAR(50) NOT NULL DEFAULT 'Completed',
    `Supervisor` VARCHAR(150) NULL,
    `Notes` VARCHAR(500) NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`Id`),
    KEY `IX_crop_activities_ActivityCode` (`ActivityCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bank_accounts` (
    `Id` INT NOT NULL AUTO_INCREMENT,
    `BankName` VARCHAR(150) NOT NULL,
    `AccountName` VARCHAR(150) NOT NULL,
    `AccountNumber` VARCHAR(100) NOT NULL,
    `Ifsc` VARCHAR(50) NULL,
    `Branch` VARCHAR(150) NULL,
    `AccountType` VARCHAR(50) NOT NULL DEFAULT 'Current',
    `OpeningBalance` DECIMAL(18,2) NOT NULL DEFAULT 0,
    `CurrentBalance` DECIMAL(18,2) NOT NULL DEFAULT 0,
    `Status` VARCHAR(30) NOT NULL DEFAULT 'Active',
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME NULL,
    PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";
                await context.Database.ExecuteSqlRawAsync(sql);

                // Add missing columns to income_categories safely
                try
                {
                    await EnsureColumnExistsAsync(context, "income_categories", "Code", "ALTER TABLE `income_categories` ADD COLUMN `Code` VARCHAR(50) NULL AFTER `Id`");
                    await EnsureColumnExistsAsync(context, "income_categories", "Source", "ALTER TABLE `income_categories` ADD COLUMN `Source` VARCHAR(150) NULL AFTER `Name`");
                    await EnsureColumnExistsAsync(context, "income_categories", "Status", "ALTER TABLE `income_categories` ADD COLUMN `Status` VARCHAR(30) NOT NULL DEFAULT 'Active' AFTER `IsActive`");
                    await EnsureColumnExistsAsync(context, "income_categories", "CreatedAt", "ALTER TABLE `income_categories` ADD COLUMN `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
                    await context.Database.ExecuteSqlRawAsync("UPDATE `income_categories` SET `Code` = CONCAT('INC-CAT-', `Id`) WHERE `Code` IS NULL OR `Code` = ''");
                    await context.Database.ExecuteSqlRawAsync("UPDATE `income_categories` SET `Status` = 'Active' WHERE `Status` IS NULL OR `Status` = ''");
                }
                catch { }

                // Seed default Bank Accounts if empty
                if (!await context.BankAccounts.AnyAsync())
                {
                    context.BankAccounts.AddRange(
                        new BankAccount { BankName = "HDFC Bank", AccountName = "AGRIMAN Farm Account", AccountNumber = "50200084821", Ifsc = "HDFC0001042", Branch = "Vijayawada", AccountType = "Current", OpeningBalance = 200000, CurrentBalance = 682450, Status = "Active" },
                        new BankAccount { BankName = "State Bank of India", AccountName = "Kisan Credit Account", AccountNumber = "31980029141", Ifsc = "SBIN0004128", Branch = "Guntur", AccountType = "Current", OpeningBalance = 150000, CurrentBalance = 312000, Status = "Active" },
                        new BankAccount { BankName = "Cash Account", AccountName = "Farm Cash", AccountNumber = "CASH-001", Ifsc = "", Branch = "Main Farm Office", AccountType = "Cash", OpeningBalance = 25000, CurrentBalance = 38500, Status = "Active" }
                    );
                    await context.SaveChangesAsync();
                }

                // Seed default Crop Varieties if empty
                if (!await context.CropVarieties.AnyAsync())
                {
                    context.CropVarieties.AddRange(
                        new CropVariety { Code = "VAR-001", CropName = "Paddy (Rice)", VarietyName = "BPT 5204 (Samba Mahsuri)", DurationDays = 145, Season = "Kharif", ExpectedYield = "25-30 Qtl/Acre", Status = "Active" },
                        new CropVariety { Code = "VAR-002", CropName = "Cotton", VarietyName = "BT Cotton-2 (Bollgard II)", DurationDays = 160, Season = "Kharif", ExpectedYield = "12-15 Qtl/Acre", Status = "Active" },
                        new CropVariety { Code = "VAR-003", CropName = "Chilli", VarietyName = "Teja Red (G4 Hybrid)", DurationDays = 150, Season = "Kharif-Rabi", ExpectedYield = "20-25 Qtl/Acre", Status = "Active" },
                        new CropVariety { Code = "VAR-004", CropName = "Groundnut", VarietyName = "TAG-24 (Semi-Dwarf)", DurationDays = 110, Season = "Kharif", ExpectedYield = "18-22 Qtl/Acre", Status = "Active" },
                        new CropVariety { Code = "VAR-005", CropName = "Maize", VarietyName = "Pioneer 3396 Hybrid", DurationDays = 105, Season = "Kharif", ExpectedYield = "35-40 Qtl/Acre", Status = "Active" },
                        new CropVariety { Code = "VAR-006", CropName = "Tomato", VarietyName = "US 440 Determinate", DurationDays = 90, Season = "Rabi", ExpectedYield = "250-300 Box/Acre", Status = "Active" },
                        new CropVariety { Code = "VAR-007", CropName = "Sugarcane", VarietyName = "Co 86032 (Nayana)", DurationDays = 360, Season = "Perennial", ExpectedYield = "45-50 Ton/Acre", Status = "Active" }
                    );
                    await context.SaveChangesAsync();
                }

                // Seed default Crop Activities if empty
                if (!await context.CropActivities.AnyAsync())
                {
                    context.CropActivities.AddRange(
                        new CropActivity { ActivityCode = "ACT-2025-01", Farm = "Farm 1 (South Block)", Crop = "Cotton", Season = "Kharif 2025-26", ActivityType = "Land Preparation", ActivityDate = DateTime.UtcNow.AddDays(-140), LabourWorkers = "4 Labourers", Machinery = "Mahindra 575 DI Tractor", MaterialsUsed = "Farmyard Manure (4 Trolleys)", TotalCost = 8500, Status = "Completed", Supervisor = "Niranjan Reddy", Notes = "Deep summer ploughing and secondary rotavator levelling." },
                        new CropActivity { ActivityCode = "ACT-2025-02", Farm = "Farm 1 (South Block)", Crop = "Cotton", Season = "Kharif 2025-26", ActivityType = "Sowing / Planting", ActivityDate = DateTime.UtcNow.AddDays(-120), LabourWorkers = "6 Labourers", Machinery = "Pneumatic Seed Planter", MaterialsUsed = "BT Cotton-2 Hybrid Seed Packets (10 Pkts)", TotalCost = 12400, Status = "Completed", Supervisor = "Niranjan Reddy", Notes = "Dibbling method with 90cm x 60cm plant spacing." },
                        new CropActivity { ActivityCode = "ACT-2025-03", Farm = "Farm 2 (Canal Belt)", Crop = "Paddy (Rice)", Season = "Kharif 2025-26", ActivityType = "Nursery Raising & Sowing", ActivityDate = DateTime.UtcNow.AddDays(-115), LabourWorkers = "5 Labourers", Machinery = "Mini Tiller", MaterialsUsed = "BPT 5204 Treated Foundation Seeds (50 Kg)", TotalCost = 7800, Status = "Completed", Supervisor = "K. Ramarao", Notes = "Raised wet nursery bed with organic bio-fertilizer slurry." },
                        new CropActivity { ActivityCode = "ACT-2025-04", Farm = "Farm 2 (Canal Belt)", Crop = "Paddy (Rice)", Season = "Kharif 2025-26", ActivityType = "Transplantation", ActivityDate = DateTime.UtcNow.AddDays(-90), LabourWorkers = "12 Women Labourers", Machinery = "Manual Transplantation", MaterialsUsed = "Zinc Sulphate & DAP Starter Dose (100 Kg)", TotalCost = 15200, Status = "Completed", Supervisor = "K. Ramarao", Notes = "Line planting of 22-day old paddy seedlings." },
                        new CropActivity { ActivityCode = "ACT-2025-05", Farm = "Sunrise Farms (East Block)", Crop = "Chilli", Season = "Annual 2025", ActivityType = "Drip & Mulching Setup", ActivityDate = DateTime.UtcNow.AddDays(-75), LabourWorkers = "4 Technicians", Machinery = "Bed Maker & Mulch Layer", MaterialsUsed = "Silver-Black UV Mulch Film & Inline Drip Laterals", TotalCost = 28000, Status = "Completed", Supervisor = "V. Krishna Murthy", Notes = "Raised beds with 30 micron plastic mulch and dual drippers." }
                    );
                    await context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Loan Table Ensure Note]: {ex.Message}");
            }
        }

        public static async Task EnsurePaymentReceiptSchemaAsync(FarmDbContext context)
        {
            try
            {
                context.ChangeTracker.Clear();
                var ddl = @"
CREATE TABLE IF NOT EXISTS `finance_payments` (
    `Id` INT NOT NULL AUTO_INCREMENT,
    `PaymentNo` VARCHAR(50) NOT NULL,
    `Date` DATETIME NOT NULL,
    `Party` VARCHAR(150) NOT NULL,
    `PaymentType` VARCHAR(100) NOT NULL DEFAULT 'Supplier Payment',
    `Purpose` VARCHAR(150) NOT NULL DEFAULT 'Supplier Payment',
    `Category` VARCHAR(120) NOT NULL DEFAULT 'General Outflow',
    `PayeeType` VARCHAR(100) NOT NULL DEFAULT 'Supplier / Vendor',
    `ContactInfo` VARCHAR(100) NULL,
    `Farm` VARCHAR(150) NULL,
    `FieldParcel` VARCHAR(120) NULL,
    `Crop` VARCHAR(120) NULL,
    `Season` VARCHAR(100) NULL,
    `RefType` VARCHAR(50) NOT NULL DEFAULT 'None',
    `ReferenceTransaction` VARCHAR(100) NULL,
    `OriginalAmount` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    `OutstandingAmount` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    `Amount` DECIMAL(18,2) NOT NULL,
    `AdditionalCharges` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    `Discount` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    `TotalAmount` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    `PaymentMode` VARCHAR(50) NOT NULL DEFAULT 'Bank Transfer',
    `BankAccountId` INT NULL,
    `BankAccount` VARCHAR(150) NOT NULL,
    `ReferenceNo` VARCHAR(100) NULL,
    `ChequeNo` VARCHAR(100) NULL,
    `ChequeDate` DATETIME NULL,
    `SupplierId` BIGINT NULL,
    `LabourId` INT NULL,
    `Remarks` VARCHAR(500) NULL,
    `Status` VARCHAR(30) NOT NULL DEFAULT 'Completed',
    `CancellationReason` VARCHAR(300) NULL,
    `CancelledAt` DATETIME NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME NULL,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `UQ_finance_payments_PaymentNo` (`PaymentNo`),
    KEY `IX_finance_payments_Date` (`Date`),
    KEY `IX_finance_payments_Status` (`Status`),
    KEY `IX_finance_payments_PaymentMode` (`PaymentMode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
                await context.Database.ExecuteSqlRawAsync(ddl);

                var receiptsDdl = @"
CREATE TABLE IF NOT EXISTS `finance_receipts` (
    `Id` INT NOT NULL AUTO_INCREMENT,
    `ReceiptNo` VARCHAR(50) NOT NULL,
    `Date` DATETIME NOT NULL,
    `From` VARCHAR(150) NOT NULL,
    `Purpose` VARCHAR(150) NOT NULL DEFAULT 'Crop Sales',
    `Category` VARCHAR(120) NOT NULL DEFAULT 'Crop Sales',
    `PayerType` VARCHAR(100) NOT NULL DEFAULT 'Wholesale Buyer / Trader',
    `ContactInfo` VARCHAR(100) NULL,
    `Farm` VARCHAR(150) NULL,
    `FieldParcel` VARCHAR(120) NULL,
    `Crop` VARCHAR(120) NULL,
    `Season` VARCHAR(100) NULL,
    `RefType` VARCHAR(50) NOT NULL DEFAULT 'None',
    `Reference` VARCHAR(100) NULL,
    `OriginalAmount` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    `OutstandingAmount` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    `Amount` DECIMAL(18,2) NOT NULL,
    `Discount` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    `OtherCharges` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    `FinalAmount` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    `PaymentMode` VARCHAR(50) NOT NULL DEFAULT 'Bank Transfer',
    `BankAccountId` INT NULL,
    `BankAccount` VARCHAR(150) NOT NULL,
    `TransactionRef` VARCHAR(100) NULL,
    `ChequeNo` VARCHAR(100) NULL,
    `ChequeDate` DATETIME NULL,
    `BuyerId` INT NULL,
    `SaleId` INT NULL,
    `Remarks` VARCHAR(500) NULL,
    `Status` VARCHAR(30) NOT NULL DEFAULT 'Completed',
    `CancellationReason` VARCHAR(300) NULL,
    `CancelledAt` DATETIME NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME NULL,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `UQ_finance_receipts_ReceiptNo` (`ReceiptNo`),
    KEY `IX_finance_receipts_Date` (`Date`),
    KEY `IX_finance_receipts_Status` (`Status`),
    KEY `IX_finance_receipts_PaymentMode` (`PaymentMode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
                await context.Database.ExecuteSqlRawAsync(receiptsDdl);

                // Safe idempotent column upgrades for pre-existing finance_payments tables
                var paymentColumns = new (string Col, string AlterSql)[]
                {
                    ("Purpose", "ALTER TABLE `finance_payments` ADD COLUMN `Purpose` VARCHAR(150) NOT NULL DEFAULT 'Supplier Payment'"),
                    ("Category", "ALTER TABLE `finance_payments` ADD COLUMN `Category` VARCHAR(120) NOT NULL DEFAULT 'General Outflow'"),
                    ("PayeeType", "ALTER TABLE `finance_payments` ADD COLUMN `PayeeType` VARCHAR(100) NOT NULL DEFAULT 'Supplier / Vendor'"),
                    ("ContactInfo", "ALTER TABLE `finance_payments` ADD COLUMN `ContactInfo` VARCHAR(100) NULL"),
                    ("Farm", "ALTER TABLE `finance_payments` ADD COLUMN `Farm` VARCHAR(150) NULL"),
                    ("FieldParcel", "ALTER TABLE `finance_payments` ADD COLUMN `FieldParcel` VARCHAR(120) NULL"),
                    ("Crop", "ALTER TABLE `finance_payments` ADD COLUMN `Crop` VARCHAR(120) NULL"),
                    ("Season", "ALTER TABLE `finance_payments` ADD COLUMN `Season` VARCHAR(100) NULL"),
                    ("RefType", "ALTER TABLE `finance_payments` ADD COLUMN `RefType` VARCHAR(50) NOT NULL DEFAULT 'None'"),
                    ("OriginalAmount", "ALTER TABLE `finance_payments` ADD COLUMN `OriginalAmount` DECIMAL(18,2) NOT NULL DEFAULT 0.00"),
                    ("OutstandingAmount", "ALTER TABLE `finance_payments` ADD COLUMN `OutstandingAmount` DECIMAL(18,2) NOT NULL DEFAULT 0.00"),
                    ("AdditionalCharges", "ALTER TABLE `finance_payments` ADD COLUMN `AdditionalCharges` DECIMAL(18,2) NOT NULL DEFAULT 0.00"),
                    ("Discount", "ALTER TABLE `finance_payments` ADD COLUMN `Discount` DECIMAL(18,2) NOT NULL DEFAULT 0.00"),
                    ("TotalAmount", "ALTER TABLE `finance_payments` ADD COLUMN `TotalAmount` DECIMAL(18,2) NOT NULL DEFAULT 0.00"),
                    ("BankAccountId", "ALTER TABLE `finance_payments` ADD COLUMN `BankAccountId` INT NULL"),
                    ("ChequeNo", "ALTER TABLE `finance_payments` ADD COLUMN `ChequeNo` VARCHAR(100) NULL"),
                    ("ChequeDate", "ALTER TABLE `finance_payments` ADD COLUMN `ChequeDate` DATETIME NULL"),
                    ("SupplierId", "ALTER TABLE `finance_payments` ADD COLUMN `SupplierId` BIGINT NULL"),
                    ("LabourId", "ALTER TABLE `finance_payments` ADD COLUMN `LabourId` INT NULL"),
                    ("Status", "ALTER TABLE `finance_payments` ADD COLUMN `Status` VARCHAR(30) NOT NULL DEFAULT 'Completed'"),
                    ("CancellationReason", "ALTER TABLE `finance_payments` ADD COLUMN `CancellationReason` VARCHAR(300) NULL"),
                    ("CancelledAt", "ALTER TABLE `finance_payments` ADD COLUMN `CancelledAt` DATETIME NULL"),
                    ("UpdatedAt", "ALTER TABLE `finance_payments` ADD COLUMN `UpdatedAt` DATETIME NULL")
                };

                foreach (var (col, alterSql) in paymentColumns)
                    await EnsureColumnExistsAsync(context, "finance_payments", col, alterSql);

                // Safe idempotent column upgrades for pre-existing finance_receipts tables
                var receiptColumns = new (string Col, string AlterSql)[]
                {
                    ("Purpose", "ALTER TABLE `finance_receipts` ADD COLUMN `Purpose` VARCHAR(150) NOT NULL DEFAULT 'Crop Sales'"),
                    ("Category", "ALTER TABLE `finance_receipts` ADD COLUMN `Category` VARCHAR(120) NOT NULL DEFAULT 'Crop Sales'"),
                    ("PayerType", "ALTER TABLE `finance_receipts` ADD COLUMN `PayerType` VARCHAR(100) NOT NULL DEFAULT 'Wholesale Buyer / Trader'"),
                    ("ContactInfo", "ALTER TABLE `finance_receipts` ADD COLUMN `ContactInfo` VARCHAR(100) NULL"),
                    ("Farm", "ALTER TABLE `finance_receipts` ADD COLUMN `Farm` VARCHAR(150) NULL"),
                    ("FieldParcel", "ALTER TABLE `finance_receipts` ADD COLUMN `FieldParcel` VARCHAR(120) NULL"),
                    ("Crop", "ALTER TABLE `finance_receipts` ADD COLUMN `Crop` VARCHAR(120) NULL"),
                    ("Season", "ALTER TABLE `finance_receipts` ADD COLUMN `Season` VARCHAR(100) NULL"),
                    ("RefType", "ALTER TABLE `finance_receipts` ADD COLUMN `RefType` VARCHAR(50) NOT NULL DEFAULT 'None'"),
                    ("OriginalAmount", "ALTER TABLE `finance_receipts` ADD COLUMN `OriginalAmount` DECIMAL(18,2) NOT NULL DEFAULT 0.00"),
                    ("OutstandingAmount", "ALTER TABLE `finance_receipts` ADD COLUMN `OutstandingAmount` DECIMAL(18,2) NOT NULL DEFAULT 0.00"),
                    ("Discount", "ALTER TABLE `finance_receipts` ADD COLUMN `Discount` DECIMAL(18,2) NOT NULL DEFAULT 0.00"),
                    ("OtherCharges", "ALTER TABLE `finance_receipts` ADD COLUMN `OtherCharges` DECIMAL(18,2) NOT NULL DEFAULT 0.00"),
                    ("FinalAmount", "ALTER TABLE `finance_receipts` ADD COLUMN `FinalAmount` DECIMAL(18,2) NOT NULL DEFAULT 0.00"),
                    ("BankAccountId", "ALTER TABLE `finance_receipts` ADD COLUMN `BankAccountId` INT NULL"),
                    ("TransactionRef", "ALTER TABLE `finance_receipts` ADD COLUMN `TransactionRef` VARCHAR(100) NULL"),
                    ("ChequeNo", "ALTER TABLE `finance_receipts` ADD COLUMN `ChequeNo` VARCHAR(100) NULL"),
                    ("ChequeDate", "ALTER TABLE `finance_receipts` ADD COLUMN `ChequeDate` DATETIME NULL"),
                    ("BuyerId", "ALTER TABLE `finance_receipts` ADD COLUMN `BuyerId` INT NULL"),
                    ("SaleId", "ALTER TABLE `finance_receipts` ADD COLUMN `SaleId` INT NULL"),
                    ("Status", "ALTER TABLE `finance_receipts` ADD COLUMN `Status` VARCHAR(30) NOT NULL DEFAULT 'Completed'"),
                    ("CancellationReason", "ALTER TABLE `finance_receipts` ADD COLUMN `CancellationReason` VARCHAR(300) NULL"),
                    ("CancelledAt", "ALTER TABLE `finance_receipts` ADD COLUMN `CancelledAt` DATETIME NULL"),
                    ("UpdatedAt", "ALTER TABLE `finance_receipts` ADD COLUMN `UpdatedAt` DATETIME NULL")
                };

                foreach (var (col, alterSql) in receiptColumns)
                    await EnsureColumnExistsAsync(context, "finance_receipts", col, alterSql);

                // Backfill computed totals on legacy rows
                await context.Database.ExecuteSqlRawAsync(@"
UPDATE `finance_payments`
SET `TotalAmount` = GREATEST(0, `Amount` + `AdditionalCharges` - `Discount`),
    `OriginalAmount` = CASE WHEN `OriginalAmount` = 0 THEN `Amount` ELSE `OriginalAmount` END
WHERE `TotalAmount` = 0 AND `Amount` > 0;");

                await context.Database.ExecuteSqlRawAsync(@"
UPDATE `finance_receipts`
SET `FinalAmount` = GREATEST(0, `Amount` - `Discount` + `OtherCharges`),
    `OriginalAmount` = CASE WHEN `OriginalAmount` = 0 THEN `Amount` ELSE `OriginalAmount` END
WHERE `FinalAmount` = 0 AND `Amount` > 0;");

                // Seed rich default Finance Payments if empty
                if (!await context.FinancePayments.AnyAsync())
                {
                    context.FinancePayments.AddRange(
                        new FinancePayment
                        {
                            PaymentNo = "PAY-2026-0316", Date = DateTime.UtcNow.AddDays(-2),
                            Party = "GreenGrow Supplies", PaymentType = "Supplier Payment", Purpose = "Supplier Payment",
                            Category = "Fertilizers", PayeeType = "Supplier / Vendor", ContactInfo = "+91 98490 12345",
                            Farm = "North Field", FieldParcel = "Plot A", Crop = "Paddy", Season = "Kharif (Monsoon)",
                            RefType = "Expense", ReferenceTransaction = "EXP-2026-0098",
                            OriginalAmount = 18500, OutstandingAmount = 0, Amount = 18500, AdditionalCharges = 0, Discount = 0, TotalAmount = 18500,
                            PaymentMode = "Bank Transfer", BankAccount = "AGRIMAN Farm Account", ReferenceNo = "UTR-091334812",
                            Remarks = "Fertilizer bulk purchase settlement", Status = "Completed"
                        },
                        new FinancePayment
                        {
                            PaymentNo = "PAY-2026-0315", Date = DateTime.UtcNow.AddDays(-3),
                            Party = "Village Labour Group", PaymentType = "Labour Wages", Purpose = "Labour Wages",
                            Category = "Labour Wages", PayeeType = "Employee / Labourer", ContactInfo = "+91 94401 56789",
                            Farm = "South Orchard", FieldParcel = "Block 2", Crop = "Cotton", Season = "Kharif (Monsoon)",
                            RefType = "Expense", ReferenceTransaction = "EXP-2026-0097",
                            OriginalAmount = 8400, OutstandingAmount = 0, Amount = 8400, AdditionalCharges = 0, Discount = 0, TotalAmount = 8400,
                            PaymentMode = "Cash", BankAccount = "Farm Cash", ReferenceNo = "VOUCH-1021",
                            Remarks = "Weeding and intercultural operations", Status = "Completed"
                        },
                        new FinancePayment
                        {
                            PaymentNo = "PAY-2026-0314", Date = DateTime.UtcNow.AddDays(-6),
                            Party = "Kisan Tractor Rentals", PaymentType = "Machinery & Equipment Rental", Purpose = "Machinery & Equipment Rental",
                            Category = "Machinery Rental", PayeeType = "Service Provider", ContactInfo = "+91 97000 33445",
                            Farm = "East Meadow", FieldParcel = "Plot C", Crop = "Maize", Season = "Kharif (Monsoon)",
                            RefType = "Expense", ReferenceTransaction = "EXP-2026-0091",
                            OriginalAmount = 12000, OutstandingAmount = 4000, Amount = 8000, AdditionalCharges = 0, Discount = 0, TotalAmount = 8000,
                            PaymentMode = "UPI", BankAccount = "Kisan Credit Account", ReferenceNo = "UPI-984912-993",
                            Remarks = "50% advance for deep ploughing and harrowing", Status = "Completed"
                        },
                        new FinancePayment
                        {
                            PaymentNo = "PAY-2026-0313", Date = DateTime.UtcNow.AddDays(-9),
                            Party = "State Bank of India (Agri Branch)", PaymentType = "Loan Repayment (Principal & Interest)", Purpose = "Loan Repayment (Principal & Interest)",
                            Category = "Financial Payments", PayeeType = "Financial Institution / Bank", ContactInfo = "08452-224411",
                            Farm = "General Farm", Season = "Kharif (Monsoon)",
                            RefType = "Loan", ReferenceTransaction = "LN-2026-001",
                            OriginalAmount = 15000, OutstandingAmount = 0, Amount = 15000, AdditionalCharges = 0, Discount = 0, TotalAmount = 15000,
                            PaymentMode = "Bank Transfer", BankAccount = "Kisan Credit Account", ReferenceNo = "NEFT-SBIN2026101501",
                            Remarks = "Monthly EMI installment for Crop Loan", Status = "Completed"
                        },
                        new FinancePayment
                        {
                            PaymentNo = "PAY-2026-0312", Date = DateTime.UtcNow.AddDays(-12),
                            Party = "HPCL Fuel Station", PaymentType = "Fuel & Electricity", Purpose = "Fuel & Electricity",
                            Category = "Fuel", PayeeType = "Service Provider",
                            Farm = "Lake Farm", FieldParcel = "Pump House", Season = "Kharif (Monsoon)",
                            RefType = "None", ReferenceTransaction = "INV-HPCL-8812",
                            OriginalAmount = 4500, OutstandingAmount = 4500, Amount = 4500, AdditionalCharges = 0, Discount = 0, TotalAmount = 4500,
                            PaymentMode = "Cheque", BankAccount = "AGRIMAN Farm Account", ChequeNo = "CHQ-882190", ChequeDate = DateTime.UtcNow.AddDays(5),
                            Remarks = "Diesel purchase for irrigation generators — cheque clearance pending", Status = "Pending"
                        }
                    );
                    await context.SaveChangesAsync();
                }

                // Seed rich default Finance Receipts if empty
                if (!await context.FinanceReceipts.AnyAsync())
                {
                    context.FinanceReceipts.AddRange(
                        new FinanceReceipt
                        {
                            ReceiptNo = "REC-2026-0194", Date = DateTime.UtcNow.AddDays(-2),
                            From = "Sri Lakshmi Traders", Purpose = "Paddy Sales Collection", Category = "Crop Sales",
                            PayerType = "Wholesale Buyer / Trader", ContactInfo = "+91 98480 22334",
                            Farm = "North Field", FieldParcel = "Plot A", Crop = "Paddy", Season = "Kharif (Monsoon)",
                            RefType = "Sales Invoice", Reference = "SAL-2026-0042",
                            OriginalAmount = 175000, OutstandingAmount = 0, Amount = 175000, Discount = 0, OtherCharges = 0, FinalAmount = 175000,
                            PaymentMode = "Bank Transfer", BankAccount = "AGRIMAN Farm Account", TransactionRef = "UTR-091448123",
                            Remarks = "Full settlement for 50 quintals Grade-A paddy produce", Status = "Completed"
                        },
                        new FinanceReceipt
                        {
                            ReceiptNo = "REC-2026-0193", Date = DateTime.UtcNow.AddDays(-4),
                            From = "Dairy Cooperative Society", Purpose = "Dairy & Livestock Sales", Category = "Dairy & Livestock Income",
                            PayerType = "Agricultural Cooperative / Mandi", ContactInfo = "+91 94400 11223",
                            Farm = "Main Dairy Shed", Crop = "Cow Milk", Season = "Kharif (Monsoon)",
                            RefType = "Income Record", Reference = "INC-2026-0141",
                            OriginalAmount = 34440, OutstandingAmount = 0, Amount = 34440, Discount = 0, OtherCharges = 0, FinalAmount = 34440,
                            PaymentMode = "UPI", BankAccount = "Farm Cash", TransactionRef = "UPI-984920-881",
                            Remarks = "Fortnightly milk collection payment direct to bank UPI", Status = "Completed"
                        },
                        new FinanceReceipt
                        {
                            ReceiptNo = "REC-2026-0192", Date = DateTime.UtcNow.AddDays(-7),
                            From = "Kisan Cotton Mill Ltd", Purpose = "Cotton Sales Collection", Category = "Crop Sales",
                            PayerType = "Food Processing Company", ContactInfo = "+91 97001 88990",
                            Farm = "South Orchard", FieldParcel = "Block 2", Crop = "Cotton", Season = "Kharif (Monsoon)",
                            RefType = "Sales Invoice", Reference = "SAL-2026-0038",
                            OriginalAmount = 120000, OutstandingAmount = 35000, Amount = 85000, Discount = 0, OtherCharges = 0, FinalAmount = 85000,
                            PaymentMode = "Bank Transfer", BankAccount = "Kisan Credit Account", TransactionRef = "NEFT-SBIN2026101704",
                            Remarks = "First installment payment against raw cotton bale consignment", Status = "Completed"
                        },
                        new FinanceReceipt
                        {
                            ReceiptNo = "REC-2026-0191", Date = DateTime.UtcNow.AddDays(-10),
                            From = "Gramin Agro Mart", Purpose = "Fruits & Vegetables Sales", Category = "Vegetables Sales",
                            PayerType = "Retail Customer", ContactInfo = "+91 99887 66554",
                            Farm = "East Meadow", FieldParcel = "Plot C", Crop = "Tomatoes", Season = "Kharif (Monsoon)",
                            RefType = "Sales Invoice", Reference = "SAL-2026-0035",
                            OriginalAmount = 22500, OutstandingAmount = 0, Amount = 22500, Discount = 0, OtherCharges = 0, FinalAmount = 22500,
                            PaymentMode = "Cash", BankAccount = "Farm Cash", TransactionRef = "CSH-REC-8841",
                            Remarks = "Direct cash collection for freshly picked farm tomatoes", Status = "Completed"
                        },
                        new FinanceReceipt
                        {
                            ReceiptNo = "REC-2026-0190", Date = DateTime.UtcNow.AddDays(-13),
                            From = "Ravi Verma", Purpose = "Equipment Rental Income", Category = "Farm Equipment Rental",
                            PayerType = "Tenant Farmer", ContactInfo = "+91 98492 55443",
                            Farm = "North Field", Season = "Kharif (Monsoon)",
                            RefType = "Income Record", Reference = "INC-2026-0128",
                            OriginalAmount = 15000, OutstandingAmount = 15000, Amount = 15000, Discount = 0, OtherCharges = 0, FinalAmount = 15000,
                            PaymentMode = "Cheque", BankAccount = "AGRIMAN Farm Account", ChequeNo = "CHQ-778120", ChequeDate = DateTime.UtcNow.AddDays(4),
                            Remarks = "Rotavator and Harvester 3-day rental fee — cheque clearance in process", Status = "Pending"
                        }
                    );
                    await context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Module 17 Payment/Receipt Schema Note]: {ex.Message}");
            }
        }

        public static async Task EnsureCropProfitabilitySchemaAsync(FarmDbContext context)
        {
            try
            {
                // 1. Align farms table with Farm.cs model (fixes Unknown column 'f.Pincode' / 'f.State' / 'f.UpdatedAt')
                var farmCols = new (string Col, string AlterSql)[]
                {
                    ("State", "ALTER TABLE `farms` ADD COLUMN `State` VARCHAR(100) NOT NULL DEFAULT 'Andhra Pradesh'"),
                    ("Pincode", "ALTER TABLE `farms` ADD COLUMN `Pincode` VARCHAR(10) NULL"),
                    ("UpdatedAt", "ALTER TABLE `farms` ADD COLUMN `UpdatedAt` DATETIME NULL")
                };
                foreach (var (col, sql) in farmCols)
                    await EnsureColumnExistsAsync(context, "farms", col, sql);

                // 2. Align income_categories with IncomeCategory.cs model
                var incCatCols = new (string Col, string AlterSql)[]
                {
                    ("Code", "ALTER TABLE `income_categories` ADD COLUMN `Code` VARCHAR(50) NULL"),
                    ("Name", "ALTER TABLE `income_categories` ADD COLUMN `Name` VARCHAR(100) NOT NULL DEFAULT ''"),
                    ("Source", "ALTER TABLE `income_categories` ADD COLUMN `Source` VARCHAR(150) NULL"),
                    ("IsActive", "ALTER TABLE `income_categories` ADD COLUMN `IsActive` TINYINT(1) NOT NULL DEFAULT 1"),
                    ("Status", "ALTER TABLE `income_categories` ADD COLUMN `Status` VARCHAR(30) NOT NULL DEFAULT 'Active'"),
                    ("CreatedAt", "ALTER TABLE `income_categories` ADD COLUMN `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP")
                };
                foreach (var (col, sql) in incCatCols)
                    await EnsureColumnExistsAsync(context, "income_categories", col, sql);

                // 2b. Align farm_land_details with FarmLandDetail.cs model
                var landCols = new (string Col, string AlterSql)[]
                {
                    ("BoundariesNorth", "ALTER TABLE `farm_land_details` ADD COLUMN `BoundariesNorth` VARCHAR(200) NULL"),
                    ("BoundariesSouth", "ALTER TABLE `farm_land_details` ADD COLUMN `BoundariesSouth` VARCHAR(200) NULL"),
                    ("BoundariesEast", "ALTER TABLE `farm_land_details` ADD COLUMN `BoundariesEast` VARCHAR(200) NULL"),
                    ("BoundariesWest", "ALTER TABLE `farm_land_details` ADD COLUMN `BoundariesWest` VARCHAR(200) NULL"),
                    ("Remarks", "ALTER TABLE `farm_land_details` ADD COLUMN `Remarks` VARCHAR(500) NULL"),
                    ("UpdatedAt", "ALTER TABLE `farm_land_details` ADD COLUMN `UpdatedAt` DATETIME NULL")
                };
                foreach (var (col, sql) in landCols)
                    await EnsureColumnExistsAsync(context, "farm_land_details", col, sql);

                try
                {
                    var hasLegacyCatName = await context.Database.SqlQueryRaw<int>(
                        "SELECT CAST(COUNT(*) AS SIGNED) AS Value FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'income_categories' AND COLUMN_NAME = 'CategoryName'").FirstOrDefaultAsync();
                    if (hasLegacyCatName > 0)
                        await context.Database.ExecuteSqlRawAsync("UPDATE `income_categories` SET `Name` = `CategoryName` WHERE `Name` = ''");
                }
                catch { }

                // 3. Align income_transactions with IncomeTransaction.cs model
                var incTxCols = new (string Col, string AlterSql)[]
                {
                    ("Farm", "ALTER TABLE `income_transactions` ADD COLUMN `Farm` VARCHAR(150) NOT NULL DEFAULT ''"),
                    ("Crop", "ALTER TABLE `income_transactions` ADD COLUMN `Crop` VARCHAR(100) NULL"),
                    ("Buyer", "ALTER TABLE `income_transactions` ADD COLUMN `Buyer` VARCHAR(150) NOT NULL DEFAULT ''"),
                    ("GrossAmount", "ALTER TABLE `income_transactions` ADD COLUMN `GrossAmount` DECIMAL(18,2) NOT NULL DEFAULT 0.00"),
                    ("Discount", "ALTER TABLE `income_transactions` ADD COLUMN `Discount` DECIMAL(18,2) NOT NULL DEFAULT 0.00"),
                    ("OtherCharges", "ALTER TABLE `income_transactions` ADD COLUMN `OtherCharges` DECIMAL(18,2) NOT NULL DEFAULT 0.00"),
                    ("NetAmount", "ALTER TABLE `income_transactions` ADD COLUMN `NetAmount` DECIMAL(18,2) NOT NULL DEFAULT 0.00"),
                    ("Status", "ALTER TABLE `income_transactions` ADD COLUMN `Status` VARCHAR(30) NOT NULL DEFAULT 'Completed'")
                };
                foreach (var (col, sql) in incTxCols)
                    await EnsureColumnExistsAsync(context, "income_transactions", col, sql);

                // 4. Align expense_transactions with ExpenseTransaction.cs (snake_case EF mapping)
                var expTxCols = new (string Col, string AlterSql)[]
                {
                    ("expense_no", "ALTER TABLE `expense_transactions` ADD COLUMN `expense_no` VARCHAR(50) NOT NULL DEFAULT ''"),
                    ("expense_date", "ALTER TABLE `expense_transactions` ADD COLUMN `expense_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"),
                    ("farmer", "ALTER TABLE `expense_transactions` ADD COLUMN `farmer` VARCHAR(100) NOT NULL DEFAULT ''"),
                    ("farm", "ALTER TABLE `expense_transactions` ADD COLUMN `farm` VARCHAR(100) NOT NULL DEFAULT ''"),
                    ("crop", "ALTER TABLE `expense_transactions` ADD COLUMN `crop` VARCHAR(100) NOT NULL DEFAULT ''"),
                    ("category_id", "ALTER TABLE `expense_transactions` ADD COLUMN `category_id` INT NULL"),
                    ("expense_category", "ALTER TABLE `expense_transactions` ADD COLUMN `expense_category` VARCHAR(100) NOT NULL DEFAULT ''"),
                    ("supplier", "ALTER TABLE `expense_transactions` ADD COLUMN `supplier` VARCHAR(150) NOT NULL DEFAULT ''"),
                    ("payment_mode", "ALTER TABLE `expense_transactions` ADD COLUMN `payment_mode` VARCHAR(50) NOT NULL DEFAULT 'Cash'"),
                    ("reference_no", "ALTER TABLE `expense_transactions` ADD COLUMN `reference_no` VARCHAR(100) NULL"),
                    ("status", "ALTER TABLE `expense_transactions` ADD COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'Paid'"),
                    ("receipt_attachment_url", "ALTER TABLE `expense_transactions` ADD COLUMN `receipt_attachment_url` VARCHAR(500) NULL"),
                    ("created_at", "ALTER TABLE `expense_transactions` ADD COLUMN `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"),
                    ("updated_at", "ALTER TABLE `expense_transactions` ADD COLUMN `updated_at` DATETIME NULL")
                };
                foreach (var (col, sql) in expTxCols)
                    await EnsureColumnExistsAsync(context, "expense_transactions", col, sql);

                // 5. Align expense_categories with ExpenseCategory.cs model
                var expCatCols = new (string Col, string AlterSql)[]
                {
                    ("code", "ALTER TABLE `expense_categories` ADD COLUMN `code` VARCHAR(50) NOT NULL DEFAULT ''"),
                    ("name", "ALTER TABLE `expense_categories` ADD COLUMN `name` VARCHAR(100) NOT NULL DEFAULT ''"),
                    ("is_active", "ALTER TABLE `expense_categories` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1"),
                    ("created_at", "ALTER TABLE `expense_categories` ADD COLUMN `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP")
                };
                foreach (var (col, sql) in expCatCols)
                    await EnsureColumnExistsAsync(context, "expense_categories", col, sql);

                try
                {
                    var hasLegacyExpCat = await context.Database.SqlQueryRaw<int>(
                        "SELECT CAST(COUNT(*) AS SIGNED) AS Value FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'expense_categories' AND COLUMN_NAME = 'CategoryName'").FirstOrDefaultAsync();
                    if (hasLegacyExpCat > 0)
                        await context.Database.ExecuteSqlRawAsync("UPDATE `expense_categories` SET `name` = `CategoryName`, `code` = UPPER(REPLACE(`CategoryName`, ' ', '_')) WHERE `name` = ''");
                }
                catch { }
                // 6. Align purchases with Purchase.cs (FarmId, CropId)
                var purchaseCols = new (string Col, string AlterSql)[]
                {
                    ("FarmId", "ALTER TABLE `purchases` ADD COLUMN `FarmId` BIGINT NULL"),
                    ("CropId", "ALTER TABLE `purchases` ADD COLUMN `CropId` BIGINT NULL")
                };
                foreach (var (col, sql) in purchaseCols)
                    await EnsureColumnExistsAsync(context, "purchases", col, sql);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Crop Profitability Schema Alignment Note]: {ex.Message}");
            }
        }

        private static async Task EnsureColumnExistsAsync(FarmDbContext context, string tableName, string columnName, string alterSql)
        {
            try
            {
                var checkSql = $"SELECT CAST(COUNT(*) AS SIGNED) AS Value FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{tableName}' AND COLUMN_NAME = '{columnName}'";
                var exists = await context.Database.SqlQueryRaw<int>(checkSql).FirstOrDefaultAsync();
                if (exists == 0)
                    await context.Database.ExecuteSqlRawAsync(alterSql);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Schema Column Check {tableName}.{columnName}]: {ex.Message}");
            }
        }

        public static async Task EnsureInventorySchemaAsync(FarmDbContext context)
        {
            try
            {
                var sql = @"
CREATE TABLE IF NOT EXISTS `product_categories` (
    `Id` INT NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(100) NOT NULL,
    `Description` VARCHAR(250) NULL,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `UX_product_categories_Name` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `units` (
    `Id` INT NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(50) NOT NULL,
    `ShortCode` VARCHAR(20) NOT NULL,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `UX_units_ShortCode` (`ShortCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `products` (
    `Id` INT NOT NULL AUTO_INCREMENT,
    `Code` VARCHAR(50) NOT NULL,
    `Name` VARCHAR(150) NOT NULL,
    `CategoryId` INT NOT NULL,
    `UnitId` INT NOT NULL,
    `ReorderLevel` DECIMAL(18,2) NOT NULL DEFAULT 0,
    `StandardCost` DECIMAL(18,2) NOT NULL DEFAULT 0,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `UX_products_Code` (`Code`),
    KEY `IX_products_CategoryId` (`CategoryId`),
    KEY `IX_products_UnitId` (`UnitId`),
    CONSTRAINT `FK_products_product_categories` FOREIGN KEY (`CategoryId`) REFERENCES `product_categories` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_products_units` FOREIGN KEY (`UnitId`) REFERENCES `units` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `inventory` (
    `Id` INT NOT NULL AUTO_INCREMENT,
    `ProductId` INT NOT NULL,
    `StorageLocation` VARCHAR(100) NOT NULL DEFAULT 'Main Warehouse',
    `CurrentStock` DECIMAL(18,2) NOT NULL DEFAULT 0,
    `ReservedStock` DECIMAL(18,2) NOT NULL DEFAULT 0,
    `LastUpdated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `UX_inventory_Product_Location` (`ProductId`, `StorageLocation`),
    CONSTRAINT `FK_inventory_products` FOREIGN KEY (`ProductId`) REFERENCES `products` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `inventory_transactions` (
    `Id` BIGINT NOT NULL AUTO_INCREMENT,
    `ProductId` INT NOT NULL,
    `TransactionDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `TransactionType` VARCHAR(50) NOT NULL,
    `Quantity` DECIMAL(18,2) NOT NULL,
    `UnitPrice` DECIMAL(18,2) NOT NULL DEFAULT 0,
    `StorageLocation` VARCHAR(100) NOT NULL,
    `ReferenceType` VARCHAR(50) NULL,
    `ReferenceNumber` VARCHAR(100) NULL,
    `Notes` VARCHAR(500) NULL,
    `BalanceAfterTransaction` DECIMAL(18,2) NOT NULL DEFAULT 0,
    PRIMARY KEY (`Id`),
    KEY `IX_inventory_transactions_ProductId` (`ProductId`),
    CONSTRAINT `FK_inv_tx_products` FOREIGN KEY (`ProductId`) REFERENCES `products` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `stock_adjustments` (
    `Id` INT NOT NULL AUTO_INCREMENT,
    `AdjustmentNumber` VARCHAR(50) NOT NULL,
    `AdjustmentDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `ProductId` INT NOT NULL,
    `StorageLocation` VARCHAR(100) NOT NULL DEFAULT 'Main Warehouse',
    `BookStock` DECIMAL(18,2) NOT NULL,
    `PhysicalStock` DECIMAL(18,2) NOT NULL,
    `Reason` VARCHAR(250) NOT NULL,
    `Remarks` VARCHAR(500) NULL,
    `AdjustmentType` VARCHAR(50) NULL,
    `ApprovedBy` VARCHAR(100) NULL,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `UX_stock_adjustments_Number` (`AdjustmentNumber`),
    KEY `IX_stock_adjustments_ProductId` (`ProductId`),
    CONSTRAINT `FK_stock_adjustments_products` FOREIGN KEY (`ProductId`) REFERENCES `products` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";
                await context.Database.ExecuteSqlRawAsync(sql);

                // Safe schema evolution for existing stock_adjustments & inventory_transactions tables
                try
                {
                    var hasAdjustmentType = await context.Database.SqlQueryRaw<int>(@"
                        SELECT COUNT(*) FROM information_schema.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stock_adjustments' AND COLUMN_NAME = 'AdjustmentType'").FirstOrDefaultAsync();
                    if (hasAdjustmentType == 0)
                    {
                        await context.Database.ExecuteSqlRawAsync("ALTER TABLE `stock_adjustments` ADD COLUMN `AdjustmentType` VARCHAR(50) NULL AFTER `Remarks`");
                    }

                    var hasApprovedBy = await context.Database.SqlQueryRaw<int>(@"
                        SELECT COUNT(*) FROM information_schema.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stock_adjustments' AND COLUMN_NAME = 'ApprovedBy'").FirstOrDefaultAsync();
                    if (hasApprovedBy == 0)
                    {
                        await context.Database.ExecuteSqlRawAsync("ALTER TABLE `stock_adjustments` ADD COLUMN `ApprovedBy` VARCHAR(100) NULL AFTER `AdjustmentType`");
                    }

                    await context.Database.ExecuteSqlRawAsync("ALTER TABLE `stock_adjustments` MODIFY COLUMN `Reason` VARCHAR(250) NOT NULL");
                    await context.Database.ExecuteSqlRawAsync("UPDATE `inventory_transactions` SET `BalanceAfterTransaction` = 0 WHERE `BalanceAfterTransaction` IS NULL");
                    await context.Database.ExecuteSqlRawAsync("ALTER TABLE `inventory_transactions` MODIFY COLUMN `BalanceAfterTransaction` DECIMAL(18,2) NOT NULL DEFAULT 0");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Inventory Schema Alter Note]: {ex.Message}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Inventory Schema Ensure Note]: {ex.Message}");
            }
        }
    }
}
