using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AgriMan.Unified.Api.Migrations.Sales
{
    /// <inheritdoc />
    public partial class InitialMySqlSalesModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            // Idempotent MySQL 8.0 DDL so this migration succeeds on both fresh and pre-existing agriman_db instances.
            migrationBuilder.Sql(@"
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
    `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `UpdatedAt` DATETIME(6) DEFAULT NULL,
    INDEX `IX_Buyers_BuyerName` (`BuyerName`),
    INDEX `IX_Buyers_Status` (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Sales` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `SalesNo` VARCHAR(50) NOT NULL UNIQUE,
    `SalesDate` DATETIME(6) NOT NULL,
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
    `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `UpdatedAt` DATETIME(6) DEFAULT NULL,
    INDEX `IX_Sales_Buyer` (`Buyer`),
    INDEX `IX_Sales_BuyerId` (`BuyerId`),
    INDEX `IX_Sales_PaymentStatus` (`PaymentStatus`),
    INDEX `IX_Sales_SalesDate` (`SalesDate`),
    CONSTRAINT `FK_Sales_Buyers_BuyerId` FOREIGN KEY (`BuyerId`) REFERENCES `Buyers` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SalesItems` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `SaleId` INT DEFAULT NULL,
    `SalesNo` VARCHAR(50) NOT NULL,
    `Crop` VARCHAR(100) NOT NULL,
    `Quantity` DECIMAL(18, 2) NOT NULL,
    `Unit` VARCHAR(20) NOT NULL DEFAULT 'kg',
    `Rate` DECIMAL(18, 2) NOT NULL,
    `Amount` DECIMAL(18, 2) NOT NULL,
    `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX `IX_SalesItems_SaleId` (`SaleId`),
    INDEX `IX_SalesItems_SalesNo` (`SalesNo`),
    CONSTRAINT `FK_SalesItems_Sales_SaleId` FOREIGN KEY (`SaleId`) REFERENCES `Sales` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SalesPayments` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `SaleId` INT DEFAULT NULL,
    `BuyerId` INT DEFAULT NULL,
    `PaymentNo` VARCHAR(50) NOT NULL UNIQUE,
    `PaymentDate` DATETIME(6) NOT NULL,
    `Buyer` VARCHAR(150) NOT NULL,
    `SalesNo` VARCHAR(50) NOT NULL,
    `PaymentAmount` DECIMAL(18, 2) NOT NULL,
    `PaymentMode` VARCHAR(30) NOT NULL DEFAULT 'Bank',
    `ReferenceNo` VARCHAR(100) DEFAULT NULL,
    `Remarks` VARCHAR(255) DEFAULT NULL,
    `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `UpdatedAt` DATETIME(6) DEFAULT NULL,
    INDEX `IX_SalesPayments_Buyer` (`Buyer`),
    INDEX `IX_SalesPayments_BuyerId` (`BuyerId`),
    INDEX `IX_SalesPayments_SaleId` (`SaleId`),
    INDEX `IX_SalesPayments_SalesNo` (`SalesNo`),
    CONSTRAINT `FK_SalesPayments_Buyers_BuyerId` FOREIGN KEY (`BuyerId`) REFERENCES `Buyers` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_SalesPayments_Sales_SaleId` FOREIGN KEY (`SaleId`) REFERENCES `Sales` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");

            // Upgrade pre-existing tables safely if any new columns are missing
            migrationBuilder.Sql(@"
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'sales' AND LOWER(COLUMN_NAME) = 'buyerid');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Sales` ADD COLUMN `BuyerId` INT DEFAULT NULL AFTER `SalesDate`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'sales' AND LOWER(COLUMN_NAME) = 'remarks');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Sales` ADD COLUMN `Remarks` VARCHAR(500) DEFAULT NULL AFTER `PaymentStatus`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'salespayments' AND LOWER(COLUMN_NAME) = 'saleid');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `SalesPayments` ADD COLUMN `SaleId` INT DEFAULT NULL AFTER `Id`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'salespayments' AND LOWER(COLUMN_NAME) = 'buyerid');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `SalesPayments` ADD COLUMN `BuyerId` INT DEFAULT NULL AFTER `SaleId`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'salespayments' AND LOWER(COLUMN_NAME) = 'updatedat');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `SalesPayments` ADD COLUMN `UpdatedAt` DATETIME(6) DEFAULT NULL AFTER `CreatedAt`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'buyers' AND LOWER(COLUMN_NAME) = 'updatedat');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Buyers` ADD COLUMN `UpdatedAt` DATETIME(6) DEFAULT NULL AFTER `CreatedAt`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SalesItems");

            migrationBuilder.DropTable(
                name: "SalesPayments");

            migrationBuilder.DropTable(
                name: "Sales");

            migrationBuilder.DropTable(
                name: "Buyers");
        }
    }
}
