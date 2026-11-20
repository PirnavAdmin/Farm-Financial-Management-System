using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SalesApi.Models;

namespace SalesApi.Data;

public static class SalesDbInitializer
{
    public static async Task InitializeAsync(SalesDbContext context, ILogger logger)
    {
        try
        {
            if (context.Database.IsRelational())
            {
                await context.Database.MigrateAsync();
                logger.LogInformation("[agriman_db] Applied EF Core Sales migrations (__EFMigrationsHistory_Sales).");
            }
            await EnsureMySqlSchemaAsync(context, logger);
            await SeedInitialDataAsync(context, logger);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "[agriman_db] Sales module initialization notice: {Message}", ex.Message);
        }
    }

    public static async Task EnsureMySqlSchemaAsync(SalesDbContext context, ILogger? logger = null)
    {
        // Only run MySQL DDL when connected to a relational MySQL provider
        if (!context.Database.IsRelational())
        {
            return;
        }

        const string createBuyersSql = @"
CREATE TABLE IF NOT EXISTS `Buyers` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `BuyerCode` VARCHAR(50) NOT NULL UNIQUE,
    `BuyerName` VARCHAR(150) NOT NULL,
    `Mobile` VARCHAR(20) NOT NULL,
    `Address` VARCHAR(255) DEFAULT NULL,
    `BusinessName` VARCHAR(150) DEFAULT NULL,
    `Gstin` VARCHAR(30) DEFAULT NULL,
    `OpeningBalance` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `Status` VARCHAR(20) NOT NULL DEFAULT 'Active',
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_buyers_name` (`BuyerName`),
    INDEX `idx_buyers_status` (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

        const string createSalesSql = @"
CREATE TABLE IF NOT EXISTS `Sales` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `SalesNo` VARCHAR(50) NOT NULL UNIQUE,
    `SalesDate` DATETIME NOT NULL,
    `BuyerId` INT DEFAULT NULL,
    `Buyer` VARCHAR(150) NOT NULL,
    `Farm` VARCHAR(150) NOT NULL,
    `Crop` VARCHAR(100) NOT NULL,
    `Quantity` DECIMAL(18, 2) NOT NULL,
    `Unit` VARCHAR(20) NOT NULL DEFAULT 'kg',
    `Rate` DECIMAL(18, 2) NOT NULL,
    `GrossAmount` DECIMAL(18, 2) NOT NULL,
    `Commission` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `Transport` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `NetAmount` DECIMAL(18, 2) NOT NULL,
    `PaymentStatus` VARCHAR(30) NOT NULL DEFAULT 'Pending',
    `Remarks` VARCHAR(500) DEFAULT NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_sales_date` (`SalesDate`),
    INDEX `idx_sales_buyer` (`Buyer`),
    INDEX `idx_sales_status` (`PaymentStatus`),
    CONSTRAINT `fk_sales_buyer` FOREIGN KEY (`BuyerId`) REFERENCES `Buyers` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

        const string createSalesItemsSql = @"
CREATE TABLE IF NOT EXISTS `SalesItems` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `SaleId` INT DEFAULT NULL,
    `SalesNo` VARCHAR(50) NOT NULL,
    `Crop` VARCHAR(100) NOT NULL,
    `Quantity` DECIMAL(18, 2) NOT NULL,
    `Unit` VARCHAR(20) NOT NULL DEFAULT 'kg',
    `Rate` DECIMAL(18, 2) NOT NULL,
    `Amount` DECIMAL(18, 2) NOT NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_sales_items_saleid` (`SaleId`),
    INDEX `idx_sales_items_salesno` (`SalesNo`),
    CONSTRAINT `fk_sales_items_sale` FOREIGN KEY (`SaleId`) REFERENCES `Sales` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

        const string createSalesPaymentsSql = @"
CREATE TABLE IF NOT EXISTS `SalesPayments` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `SaleId` INT DEFAULT NULL,
    `BuyerId` INT DEFAULT NULL,
    `PaymentNo` VARCHAR(50) NOT NULL UNIQUE,
    `PaymentDate` DATETIME NOT NULL,
    `Buyer` VARCHAR(150) NOT NULL,
    `SalesNo` VARCHAR(50) NOT NULL,
    `PaymentAmount` DECIMAL(18, 2) NOT NULL,
    `PaymentMode` VARCHAR(30) NOT NULL DEFAULT 'Bank',
    `ReferenceNo` VARCHAR(100) DEFAULT NULL,
    `Remarks` VARCHAR(255) DEFAULT NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_sales_payments_saleid` (`SaleId`),
    INDEX `idx_sales_payments_salesno` (`SalesNo`),
    INDEX `idx_sales_payments_buyer` (`Buyer`),
    CONSTRAINT `fk_sales_payments_sale` FOREIGN KEY (`SaleId`) REFERENCES `Sales` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sales_payments_buyer` FOREIGN KEY (`BuyerId`) REFERENCES `Buyers` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

        await context.Database.ExecuteSqlRawAsync(createBuyersSql);
        await context.Database.ExecuteSqlRawAsync(createSalesSql);
        await context.Database.ExecuteSqlRawAsync(createSalesItemsSql);
        await context.Database.ExecuteSqlRawAsync(createSalesPaymentsSql);

        // Safely add new columns if older tables already existed without them
        await AddColumnIfMissingAsync(context, "Sales", "BuyerId", "INT DEFAULT NULL AFTER `SalesDate`");
        await AddColumnIfMissingAsync(context, "Sales", "Remarks", "VARCHAR(500) DEFAULT NULL AFTER `PaymentStatus`");
        await AddColumnIfMissingAsync(context, "SalesPayments", "SaleId", "INT DEFAULT NULL AFTER `Id`");
        await AddColumnIfMissingAsync(context, "SalesPayments", "BuyerId", "INT DEFAULT NULL AFTER `SaleId`");
        await AddColumnIfMissingAsync(context, "SalesPayments", "UpdatedAt", "DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP AFTER `CreatedAt`");
        await AddColumnIfMissingAsync(context, "Buyers", "UpdatedAt", "DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP AFTER `CreatedAt`");

        logger?.LogInformation("[agriman_db] Ensured Module 10 Sales tables: Buyers, Sales, SalesItems, SalesPayments.");
    }

    private static async Task AddColumnIfMissingAsync(SalesDbContext context, string tableName, string columnName, string columnDefinition)
    {
        var checkSql = $@"
SELECT COUNT(*) AS `Value`
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND LOWER(TABLE_NAME) = LOWER('{tableName}')
  AND LOWER(COLUMN_NAME) = LOWER('{columnName}')";

        var rows = await context.Database.SqlQueryRaw<long>(checkSql).ToListAsync();
        var exists = rows.Count > 0 ? rows[0] : 0L;
        if (exists == 0)
        {
#pragma warning disable EF1002 // Internal static schema DDL migration; table/column identifiers are compile-time constants
            await context.Database.ExecuteSqlRawAsync($"ALTER TABLE `{tableName}` ADD COLUMN `{columnName}` {columnDefinition};");
#pragma warning restore EF1002
        }
    }

    public static async Task<(int BuyersSeeded, int SalesSeeded, int ItemsSeeded, int PaymentsSeeded)> SeedInitialDataAsync(
        SalesDbContext context,
        ILogger? logger = null)
    {
        int buyersSeeded = 0;
        int salesSeeded = 0;
        int itemsSeeded = 0;
        int paymentsSeeded = 0;

        // 1. Seed Buyers if empty
        if (!await context.Buyers.AnyAsync())
        {
            var seedBuyers = new List<Buyer>
            {
                new()
                {
                    BuyerCode = "BUY-001",
                    BuyerName = "Sri Lakshmi Traders",
                    Mobile = "9876543210",
                    Address = "Main Market Yard, Vijayawada, Andhra Pradesh",
                    BusinessName = "Sri Lakshmi Agri Traders",
                    Gstin = "37ABCDE1234F1Z5",
                    OpeningBalance = 25000m,
                    Status = "Active",
                    CreatedAt = new DateTime(2026, 10, 15, 9, 0, 0, DateTimeKind.Utc)
                },
                new()
                {
                    BuyerCode = "BUY-002",
                    BuyerName = "Dairy Cooperative Society",
                    Mobile = "9876512340",
                    Address = "Milk Chilling Centre, Guntur, Andhra Pradesh",
                    BusinessName = "Guntur Milk Producers Union",
                    Gstin = "37FGHIJ5678K1Z2",
                    OpeningBalance = 0m,
                    Status = "Active",
                    CreatedAt = new DateTime(2026, 10, 16, 10, 30, 0, DateTimeKind.Utc)
                },
                new()
                {
                    BuyerCode = "BUY-003",
                    BuyerName = "Hyderabad Wholesale Mandi",
                    Mobile = "9849011223",
                    Address = "Bowenpally Market Yard, Secunderabad, Telangana",
                    BusinessName = "Telangana Agro Mandi Pvt Ltd",
                    Gstin = "36AAACT9876Q1Z9",
                    OpeningBalance = 15000m,
                    Status = "Active",
                    CreatedAt = new DateTime(2026, 10, 18, 11, 15, 0, DateTimeKind.Utc)
                },
                new()
                {
                    BuyerCode = "BUY-004",
                    BuyerName = "Kisan Export & Trading Co",
                    Mobile = "9988776655",
                    Address = "APMC Market Complex, Kurnool, Andhra Pradesh",
                    BusinessName = "Kisan Export Commercial Ventures",
                    Gstin = "37KLMNO4321P1Z4",
                    OpeningBalance = 0m,
                    Status = "Active",
                    CreatedAt = new DateTime(2026, 10, 20, 14, 0, 0, DateTimeKind.Utc)
                },
                new()
                {
                    BuyerCode = "BUY-005",
                    BuyerName = "Annapurna Rice Millers",
                    Mobile = "9848022334",
                    Address = "Industrial Estate, Miryalaguda, Telangana",
                    BusinessName = "Annapurna Grain Processors Ltd",
                    Gstin = "36PQRS7890R1Z8",
                    OpeningBalance = 50000m,
                    Status = "Active",
                    CreatedAt = new DateTime(2026, 10, 22, 16, 45, 0, DateTimeKind.Utc)
                }
            };

            context.Buyers.AddRange(seedBuyers);
            await context.SaveChangesAsync();
            buyersSeeded = seedBuyers.Count;
        }

        var buyersByName = await context.Buyers
            .AsNoTracking()
            .ToDictionaryAsync(b => b.BuyerName.ToLower(), b => b.Id);

        int? LookupBuyerId(string name) =>
            buyersByName.TryGetValue(name.ToLower(), out var id) ? id : null;

        // 2. Seed Sales if empty
        if (!await context.Sales.AnyAsync())
        {
            var seedSales = new List<Sale>
            {
                new()
                {
                    SalesNo = "SAL-2026-001",
                    SalesDate = new DateTime(2026, 10, 25),
                    BuyerId = LookupBuyerId("Sri Lakshmi Traders"),
                    Buyer = "Sri Lakshmi Traders",
                    Farm = "Sunrise Valley Farm",
                    Crop = "Paddy (Rice)",
                    Quantity = 100m,
                    Unit = "Quintals",
                    Rate = 2250m,
                    GrossAmount = 225000m,
                    Commission = 2000m,
                    Transport = 3000m,
                    NetAmount = 220000m,
                    PaymentStatus = "Paid",
                    Remarks = "Kharif Paddy harvest lot",
                    CreatedAt = new DateTime(2026, 10, 25, 10, 0, 0, DateTimeKind.Utc)
                },
                new()
                {
                    SalesNo = "SAL-2026-002",
                    SalesDate = new DateTime(2026, 11, 5),
                    BuyerId = LookupBuyerId("Hyderabad Wholesale Mandi"),
                    Buyer = "Hyderabad Wholesale Mandi",
                    Farm = "Green Hills Orchard",
                    Crop = "Organic Tomatoes",
                    Quantity = 2500m,
                    Unit = "kg",
                    Rate = 32m,
                    GrossAmount = 80000m,
                    Commission = 1600m,
                    Transport = 2400m,
                    NetAmount = 76000m,
                    PaymentStatus = "Partially Paid",
                    Remarks = "Grade-A fresh tomatoes dispatched to Bowenpally mandi",
                    CreatedAt = new DateTime(2026, 11, 5, 11, 30, 0, DateTimeKind.Utc)
                },
                new()
                {
                    SalesNo = "SAL-2026-003",
                    SalesDate = new DateTime(2026, 11, 10),
                    BuyerId = LookupBuyerId("Annapurna Rice Millers"),
                    Buyer = "Annapurna Rice Millers",
                    Farm = "North Field Farm",
                    Crop = "Maize",
                    Quantity = 80m,
                    Unit = "Quintals",
                    Rate = 2150m,
                    GrossAmount = 172000m,
                    Commission = 2000m,
                    Transport = 3500m,
                    NetAmount = 166500m,
                    PaymentStatus = "Pending",
                    Remarks = "Dried yellow maize grain",
                    CreatedAt = new DateTime(2026, 11, 10, 14, 15, 0, DateTimeKind.Utc)
                },
                new()
                {
                    SalesNo = "SAL-2026-004",
                    SalesDate = new DateTime(2026, 11, 12),
                    BuyerId = LookupBuyerId("Dairy Cooperative Society"),
                    Buyer = "Dairy Cooperative Society",
                    Farm = "East Lake Farm",
                    Crop = "Chilli",
                    Quantity = 45m,
                    Unit = "Quintals",
                    Rate = 16500m,
                    GrossAmount = 742500m,
                    Commission = 7500m,
                    Transport = 6000m,
                    NetAmount = 729000m,
                    PaymentStatus = "Partially Paid",
                    Remarks = "Guntur Teja dried red chilli",
                    CreatedAt = new DateTime(2026, 11, 12, 15, 20, 0, DateTimeKind.Utc)
                },
                new()
                {
                    SalesNo = "SAL-2026-005",
                    SalesDate = new DateTime(2026, 11, 15),
                    BuyerId = LookupBuyerId("Kisan Export & Trading Co"),
                    Buyer = "Kisan Export & Trading Co",
                    Farm = "Sunrise Valley Farm",
                    Crop = "Cotton",
                    Quantity = 60m,
                    Unit = "Quintals",
                    Rate = 7200m,
                    GrossAmount = 432000m,
                    Commission = 4500m,
                    Transport = 4000m,
                    NetAmount = 423500m,
                    PaymentStatus = "Paid",
                    Remarks = "Long-staple cotton bales",
                    CreatedAt = new DateTime(2026, 11, 15, 9, 45, 0, DateTimeKind.Utc)
                }
            };

            context.Sales.AddRange(seedSales);
            await context.SaveChangesAsync();
            salesSeeded = seedSales.Count;
        }

        var existingSales = await context.Sales.AsNoTracking().ToListAsync();
        var salesByNo = existingSales.ToDictionary(s => s.SalesNo.ToLower(), s => s);

        // 3. Seed SalesItems for any sale that currently has no SalesItems
        if (!await context.SalesItems.AnyAsync() && existingSales.Count > 0)
        {
            var seedItems = existingSales.Select(s => new SalesItem
            {
                SaleId = s.Id,
                SalesNo = s.SalesNo,
                Crop = s.Crop,
                Quantity = s.Quantity,
                Unit = s.Unit,
                Rate = s.Rate,
                Amount = s.GrossAmount,
                CreatedAt = s.CreatedAt
            }).ToList();

            context.SalesItems.AddRange(seedItems);
            await context.SaveChangesAsync();
            itemsSeeded = seedItems.Count;
        }

        // 4. Seed SalesPayments if empty
        if (!await context.SalesPayments.AnyAsync())
        {
            var candidatePayments = new[]
            {
                ("SPAY-2026-001", new DateTime(2026, 10, 25), "Sri Lakshmi Traders", "SAL-2026-001", 220000m, "Bank", "UTR-HDFC-99238472", "Full settlement for Paddy harvest sales"),
                ("SPAY-2026-002", new DateTime(2026, 11, 7), "Hyderabad Wholesale Mandi", "SAL-2026-002", 40000m, "UPI", "UPI-HYD-88291024", "Advance received via UPI for tomato shipment"),
                ("SPAY-2026-003", new DateTime(2026, 11, 14), "Dairy Cooperative Society", "SAL-2026-004", 350000m, "Bank", "NEFT-SBI-44019283", "First installment for Chilli crop sale"),
                ("SPAY-2026-004", new DateTime(2026, 11, 17), "Kisan Export & Trading Co", "SAL-2026-005", 423500m, "Bank", "RTGS-CAN-55829104", "Full clearance for cotton lot")
            };

            var seedPayments = new List<SalesPayment>();
            foreach (var (payNo, payDate, buyerName, salesNo, amount, mode, refNo, remarks) in candidatePayments)
            {
                if (!salesByNo.TryGetValue(salesNo.ToLower(), out var matchedSale))
                {
                    continue;
                }

                seedPayments.Add(new SalesPayment
                {
                    SaleId = matchedSale.Id,
                    BuyerId = matchedSale.BuyerId ?? LookupBuyerId(buyerName),
                    PaymentNo = payNo,
                    PaymentDate = payDate,
                    Buyer = matchedSale.Buyer,
                    SalesNo = matchedSale.SalesNo,
                    PaymentAmount = amount,
                    PaymentMode = mode,
                    ReferenceNo = refNo,
                    Remarks = remarks,
                    CreatedAt = DateTime.UtcNow
                });
            }

            if (seedPayments.Count > 0)
            {
                context.SalesPayments.AddRange(seedPayments);
                await context.SaveChangesAsync();
                paymentsSeeded = seedPayments.Count;
            }
        }

        if (buyersSeeded + salesSeeded + itemsSeeded + paymentsSeeded > 0)
        {
            logger?.LogInformation(
                "[agriman_db] Seeded Module 10 Sales data: {Buyers} buyers, {Sales} sales, {Items} sales items, {Payments} sales payments.",
                buyersSeeded, salesSeeded, itemsSeeded, paymentsSeeded);
        }

        return (buyersSeeded, salesSeeded, itemsSeeded, paymentsSeeded);
    }
}
