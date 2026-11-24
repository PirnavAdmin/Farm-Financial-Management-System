-- ==========================================================
-- AGRIMAN Unified - Complete MySQL Database Schema Alignment
-- Target Database: `agriman_db` (MySQL 8.0+)
-- ==========================================================

USE `agriman_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Password Resets & Module 1 Auth/Admin Tables
CREATE TABLE IF NOT EXISTS `password_resets` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Identifier` VARCHAR(150) NOT NULL,
    `UserId` INT DEFAULT NULL,
    `Otp` VARCHAR(10) NOT NULL,
    `ResetToken` VARCHAR(150) DEFAULT NULL,
    `IsVerified` TINYINT(1) NOT NULL DEFAULT 0,
    `IsUsed` TINYINT(1) NOT NULL DEFAULT 0,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `ExpiresAt` DATETIME NOT NULL,
    `UsedAt` DATETIME DEFAULT NULL,
    `IpAddress` VARCHAR(60) DEFAULT NULL,
    INDEX `idx_pw_identifier` (`Identifier`),
    CONSTRAINT `fk_pw_resets_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `UserId` INT NOT NULL,
    `Token` VARCHAR(255) NOT NULL,
    `ExpiresAt` DATETIME NOT NULL,
    `IsRevoked` TINYINT(1) NOT NULL DEFAULT 0,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_refresh_tokens_token` (`Token`),
    CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `ActorUserId` INT DEFAULT NULL,
    `ActorName` VARCHAR(100) DEFAULT NULL,
    `Action` VARCHAR(60) NOT NULL,
    `EntityType` VARCHAR(60) NOT NULL,
    `EntityId` VARCHAR(50) DEFAULT NULL,
    `Details` TEXT DEFAULT NULL,
    `IpAddress` VARCHAR(60) DEFAULT NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`ActorUserId`) REFERENCES `users` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `company_settings` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `CompanyName` VARCHAR(150) NOT NULL DEFAULT 'AGRIMAN Farms Pvt Ltd',
    `Email` VARCHAR(150) DEFAULT 'contact@agriman.in',
    `Phone` VARCHAR(30) DEFAULT '+91 98765 00000',
    `Address` VARCHAR(255) DEFAULT 'Plot 42, Green Agro Tech Park, Farm City',
    `City` VARCHAR(100) DEFAULT 'Hyderabad',
    `Country` VARCHAR(100) DEFAULT 'India',
    `PostalCode` VARCHAR(20) DEFAULT '500081',
    `TaxNumber` VARCHAR(50) DEFAULT 'GSTIN36AABCA1234F1Z5',
    `Currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
    `Timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    `Website` VARCHAR(255) DEFAULT 'https://agriman.in',
    `UpdatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ensure login_history has Identifier and RememberMe columns (MySQL 8.0 idempotent migration)
SET @col_identifier_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'login_history' AND COLUMN_NAME = 'Identifier'
);
SET @sql_add_identifier = IF(@col_identifier_exists = 0,
    'ALTER TABLE `login_history` ADD COLUMN `Identifier` VARCHAR(150) DEFAULT NULL AFTER `Email`',
    'SELECT 1');
PREPARE stmt_id FROM @sql_add_identifier;
EXECUTE stmt_id;
DEALLOCATE PREPARE stmt_id;

SET @col_remember_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'login_history' AND COLUMN_NAME = 'RememberMe'
);
SET @sql_add_remember = IF(@col_remember_exists = 0,
    'ALTER TABLE `login_history` ADD COLUMN `RememberMe` TINYINT(1) NOT NULL DEFAULT 0 AFTER `UserAgent`',
    'SELECT 1');
PREPARE stmt_rem FROM @sql_add_remember;
EXECUTE stmt_rem;
DEALLOCATE PREPARE stmt_rem;

-- 2. Irrigation Sources
CREATE TABLE IF NOT EXISTS `irrigation_sources` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Name` VARCHAR(100) NOT NULL UNIQUE,
    `Description` VARCHAR(255) DEFAULT NULL,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `irrigation_sources` (`Id`, `Name`, `Description`, `IsActive`) VALUES
(1, 'Borewell', 'Groundwater deep borewell extraction', 1),
(2, 'Canal', 'Government canal gravity irrigation', 1),
(3, 'Drip', 'Precision drip micro-irrigation system', 1),
(4, 'Rain-fed', 'Monsoon seasonal rain-fed cultivation', 1),
(5, 'Sprinkler', 'Overhead sprinkler distribution', 1),
(6, 'River Lift', 'Lift irrigation from perennial river', 1);

-- 3. Soil Types
CREATE TABLE IF NOT EXISTS `soil_types` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Name` VARCHAR(100) NOT NULL UNIQUE,
    `Description` VARCHAR(255) DEFAULT NULL,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `soil_types` (`Id`, `Name`, `Description`, `IsActive`) VALUES
(1, 'Black Soil', 'High clay content cotton soil', 1),
(2, 'Red Soil', 'Iron-rich porous agricultural soil', 1),
(3, 'Alluvial Soil', 'River basin highly fertile silt soil', 1),
(4, 'Clay Loam', 'Balanced moisture-retaining loam', 1),
(5, 'Sandy Loam', 'Fast-draining sandy loam soil', 1),
(6, 'Laterite Soil', 'Acidic high rainfall region soil', 1);

-- 4. Farm Land Details
CREATE TABLE IF NOT EXISTS `farm_land_details` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `FarmId` INT NOT NULL,
    `SurveyNumber` VARCHAR(100) NOT NULL,
    `LandArea` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `AreaUnit` VARCHAR(50) NOT NULL DEFAULT 'Acres',
    `LandType` VARCHAR(100) NOT NULL DEFAULT 'Wetland',
    `IrrigationSourceId` INT DEFAULT NULL,
    `SoilTypeId` INT DEFAULT NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_fld_farm` FOREIGN KEY (`FarmId`) REFERENCES `farms` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fld_irrigation` FOREIGN KEY (`IrrigationSourceId`) REFERENCES `irrigation_sources` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `fk_fld_soil` FOREIGN KEY (`SoilTypeId`) REFERENCES `soil_types` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Farm Documents
CREATE TABLE IF NOT EXISTS `farm_documents` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `FarmId` INT NOT NULL,
    `DocumentType` VARCHAR(100) NOT NULL,
    `FileName` VARCHAR(255) NOT NULL,
    `FilePath` VARCHAR(500) DEFAULT NULL,
    `FileSize` BIGINT DEFAULT 0,
    `ContentType` VARCHAR(100) DEFAULT NULL,
    `UploadedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_fdoc_farm` FOREIGN KEY (`FarmId`) REFERENCES `farms` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Income Transaction Items
CREATE TABLE IF NOT EXISTS `income_transaction_items` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `TransactionId` INT NOT NULL,
    `ItemName` VARCHAR(150) DEFAULT NULL,
    `Quantity` DECIMAL(18, 2) DEFAULT 0.00,
    `Unit` VARCHAR(30) NOT NULL DEFAULT 'Bags',
    `Rate` DECIMAL(18, 2) DEFAULT 0.00,
    `TotalAmount` DECIMAL(18, 2) DEFAULT 0.00,
    CONSTRAINT `fk_inc_item_tx` FOREIGN KEY (`TransactionId`) REFERENCES `income_transactions` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Income Payments
CREATE TABLE IF NOT EXISTS `income_payments` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `TransactionId` INT NOT NULL,
    `Amount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `PaymentMode` VARCHAR(50) NOT NULL DEFAULT 'Cash',
    `BankOrCash` VARCHAR(100) DEFAULT NULL,
    `ReferenceNumber` VARCHAR(100) DEFAULT NULL,
    `PaymentDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_inc_pay_tx` FOREIGN KEY (`TransactionId`) REFERENCES `income_transactions` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Purchases & Items & Payments
CREATE TABLE IF NOT EXISTS `purchases` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `FarmerId` INT DEFAULT NULL,
    `SupplierId` BIGINT UNSIGNED DEFAULT NULL,
    `PurchaseNo` VARCHAR(50) NOT NULL UNIQUE,
    `PurchaseDate` DATE NOT NULL,
    `SubTotal` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `DiscountAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `TaxAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `TotalAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `PaidAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `BalanceAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `PaymentStatus` VARCHAR(30) NOT NULL DEFAULT 'Pending',
    `Notes` VARCHAR(500) DEFAULT NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_purch_farmer` FOREIGN KEY (`FarmerId`) REFERENCES `farmers` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_purch_supplier` FOREIGN KEY (`SupplierId`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `purchase_items` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `PurchaseId` INT NOT NULL,
    `ProductName` VARCHAR(150) NOT NULL,
    `Unit` VARCHAR(30) DEFAULT NULL,
    `Quantity` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `Rate` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `Discount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `TaxRate` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `Total` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT `fk_purch_item_purch` FOREIGN KEY (`PurchaseId`) REFERENCES `purchases` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `purchase_payments` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `PurchaseId` INT NOT NULL,
    `Amount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `PaymentMode` VARCHAR(50) NOT NULL DEFAULT 'Cash',
    `BankOrCash` VARCHAR(100) DEFAULT NULL,
    `ReferenceNumber` VARCHAR(100) DEFAULT NULL,
    `PaymentDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `Notes` VARCHAR(500) DEFAULT NULL,
    CONSTRAINT `fk_purch_pay_purch` FOREIGN KEY (`PurchaseId`) REFERENCES `purchases` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Product Categories & Units Master
CREATE TABLE IF NOT EXISTS `product_categories` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Name` VARCHAR(100) NOT NULL UNIQUE,
    `Description` VARCHAR(250) DEFAULT NULL,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    INDEX `idx_pc_name` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `product_categories` (`Id`, `Name`, `Description`, `IsActive`) VALUES
(1, 'Seeds', 'Agricultural crop seeds, hybrid varieties, and certified saplings', 1),
(2, 'Fertilizers', 'Chemical, organic, and complex plant nutrients', 1),
(3, 'Pesticides', 'Chemical insecticides, fungicides, and herbicides for pest control', 1),
(4, 'Sprayer Chemicals', 'Specialized liquid sprays, adjuvants, and micronutrients', 1),
(5, 'Spare Parts', 'Tractor, tiller, irrigation pump, and sprayer spare parts', 1),
(6, 'Consumables', 'Drip lateral pipes, ropes, tarpaulins, and farm consumables');

CREATE TABLE IF NOT EXISTS `units` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Name` VARCHAR(50) NOT NULL,
    `ShortCode` VARCHAR(20) NOT NULL,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `units` (`Id`, `Name`, `ShortCode`, `IsActive`) VALUES
(1, 'Kilograms', 'kg', 1),
(2, 'Grams', 'g', 1),
(3, 'Litres', 'L', 1),
(4, 'Millilitres', 'ml', 1),
(5, 'Bags', 'Bags', 1),
(6, 'Packets', 'Packets', 1),
(7, 'Quintals', 'Quintals', 1),
(8, 'Bottles', 'btl', 1),
(9, 'Pieces / Numbers', 'nos', 1);

CREATE TABLE IF NOT EXISTS `products` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Code` VARCHAR(50) NOT NULL UNIQUE,
    `Name` VARCHAR(150) NOT NULL,
    `CategoryId` INT NOT NULL,
    `UnitId` INT NOT NULL,
    `ReorderLevel` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `StandardCost` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    INDEX `idx_products_category` (`CategoryId`),
    INDEX `idx_products_unit` (`UnitId`),
    INDEX `idx_products_code` (`Code`),
    INDEX `idx_products_isactive` (`IsActive`),
    CONSTRAINT `fk_sync_products_category` FOREIGN KEY (`CategoryId`) REFERENCES `product_categories` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_sync_products_units` FOREIGN KEY (`UnitId`) REFERENCES `units` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `ProductId` INT NOT NULL,
    `StorageLocation` VARCHAR(100) NOT NULL DEFAULT 'Main Warehouse',
    `CurrentStock` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `ReservedStock` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `LastUpdated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `ux_sync_inv_prod_loc` (`ProductId`, `StorageLocation`),
    CONSTRAINT `fk_sync_inv_product` FOREIGN KEY (`ProductId`) REFERENCES `products` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Inventory Transactions & Stock Adjustments
CREATE TABLE IF NOT EXISTS `inventory_transactions` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `ProductId` INT NOT NULL,
    `TransactionDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `TransactionType` VARCHAR(50) NOT NULL,
    `Quantity` DECIMAL(18, 2) NOT NULL,
    `UnitPrice` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `StorageLocation` VARCHAR(100) NOT NULL DEFAULT 'Main Warehouse',
    `ReferenceType` VARCHAR(50) DEFAULT NULL,
    `ReferenceNumber` VARCHAR(100) DEFAULT NULL,
    `Notes` VARCHAR(500) DEFAULT NULL,
    `BalanceAfterTransaction` DECIMAL(18, 2) DEFAULT NULL,
    CONSTRAINT `fk_inv_tx_prod` FOREIGN KEY (`ProductId`) REFERENCES `products` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stock_adjustments` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `AdjustmentNumber` VARCHAR(50) NOT NULL UNIQUE,
    `AdjustmentDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `ProductId` INT NOT NULL,
    `StorageLocation` VARCHAR(100) NOT NULL DEFAULT 'Main Warehouse',
    `BookStock` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `PhysicalStock` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `Reason` VARCHAR(100) NOT NULL,
    `Remarks` VARCHAR(500) DEFAULT NULL,
    CONSTRAINT `fk_stock_adj_prod` FOREIGN KEY (`ProductId`) REFERENCES `products` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Expense Items & Payments
CREATE TABLE IF NOT EXISTS `expense_items` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `ExpenseId` INT NOT NULL,
    `ItemName` VARCHAR(150) NOT NULL,
    `Unit` VARCHAR(20) NOT NULL DEFAULT 'unit',
    `Quantity` DECIMAL(18, 2) NOT NULL DEFAULT 1.00,
    `UnitPrice` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `TotalAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `Remarks` VARCHAR(255) DEFAULT NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_exp_item_exp` FOREIGN KEY (`ExpenseId`) REFERENCES `expense_transactions` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `expense_payments` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `ExpenseId` INT NOT NULL,
    `PaymentDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `PaymentMode` VARCHAR(50) NOT NULL DEFAULT 'Cash',
    `Amount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `BankOrCash` VARCHAR(150) DEFAULT NULL,
    `ReferenceNo` VARCHAR(100) DEFAULT NULL,
    `Status` VARCHAR(50) NOT NULL DEFAULT 'Completed',
    `Remarks` VARCHAR(500) DEFAULT NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_exp_pay_exp` FOREIGN KEY (`ExpenseId`) REFERENCES `expense_transactions` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Machinery & Fleet
CREATE TABLE IF NOT EXISTS `machinery` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `MachineName` VARCHAR(150) NOT NULL,
    `MachineType` VARCHAR(100) NOT NULL,
    `RegistrationNo` VARCHAR(100) DEFAULT NULL,
    `PurchaseDate` DATE DEFAULT NULL,
    `PurchaseCost` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `CurrentValue` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `FuelType` VARCHAR(50) DEFAULT NULL,
    `Status` VARCHAR(50) NOT NULL DEFAULT 'Active',
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_mach_name` (`MachineName`),
    INDEX `idx_mach_type` (`MachineType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `machinery_expense_types` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Code` VARCHAR(50) NOT NULL UNIQUE,
    `Name` VARCHAR(100) NOT NULL,
    `Description` VARCHAR(255) DEFAULT NULL,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `machinery_expense_types` (`Id`, `Code`, `Name`, `Description`, `IsActive`) VALUES
(1, 'FUEL', 'Fuel', 'Diesel, petrol, electric charging, and lubricants', 1),
(2, 'MAINTENANCE', 'Maintenance', 'Scheduled servicing, oil change, filter replacement', 1),
(3, 'REPAIR', 'Repair & Spare Parts', 'Breakdown repairs, spare parts, tyres', 1),
(4, 'OPERATOR_WAGES', 'Operator Wages', 'Driver and machinery operator daily/monthly wages', 1),
(5, 'INSURANCE', 'Insurance & Registration', 'Machinery insurance premiums, permits', 1),
(6, 'OTHER', 'Other', 'Miscellaneous machinery operating expenses', 1);

CREATE TABLE IF NOT EXISTS `machinery_expenses` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `MachineryId` INT DEFAULT NULL,
    `MachineName` VARCHAR(150) NOT NULL,
    `ExpenseType` VARCHAR(100) NOT NULL,
    `Date` DATE NOT NULL,
    `Amount` DECIMAL(18, 2) NOT NULL,
    `Operator` VARCHAR(150) DEFAULT NULL,
    `Remarks` VARCHAR(500) DEFAULT NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_mach_exp_mach` FOREIGN KEY (`MachineryId`) REFERENCES `machinery` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Module 10: Sales Management Tables (Buyers, Sales, SalesItems, SalesPayments)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_sales_items_saleid` (`SaleId`),
    INDEX `idx_sales_items_salesno` (`SalesNo`),
    CONSTRAINT `fk_sales_items_sale` FOREIGN KEY (`SaleId`) REFERENCES `Sales` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `Buyers` (`Id`, `BuyerCode`, `BuyerName`, `Mobile`, `Address`, `BusinessName`, `Gstin`, `OpeningBalance`, `Status`) VALUES
(1, 'BUY-001', 'Sri Lakshmi Traders', '9876543210', 'Main Market Yard, Vijayawada, Andhra Pradesh', 'Sri Lakshmi Agri Traders', '37ABCDE1234F1Z5', 25000.00, 'Active'),
(2, 'BUY-002', 'Dairy Cooperative Society', '9876512340', 'Milk Chilling Centre, Guntur, Andhra Pradesh', 'Guntur Milk Producers Union', '37FGHIJ5678K1Z2', 0.00, 'Active'),
(3, 'BUY-003', 'Hyderabad Wholesale Mandi', '9849011223', 'Bowenpally Market Yard, Secunderabad, Telangana', 'Telangana Agro Mandi Pvt Ltd', '36AAACT9876Q1Z9', 15000.00, 'Active');

INSERT IGNORE INTO `Sales` (`Id`, `SalesNo`, `SalesDate`, `BuyerId`, `Buyer`, `Farm`, `Crop`, `Quantity`, `Unit`, `Rate`, `GrossAmount`, `Commission`, `Transport`, `NetAmount`, `PaymentStatus`, `CreatedAt`)
VALUES (1, 'SAL-2026-001', '2026-10-25 00:00:00', 1, 'Sri Lakshmi Traders', 'Sunrise Valley Farm', 'Paddy (Rice)', 100.00, 'Quintals', 2250.00, 225000.00, 2000.00, 3000.00, 220000.00, 'Paid', NOW());

INSERT IGNORE INTO `SalesItems` (`Id`, `SaleId`, `SalesNo`, `Crop`, `Quantity`, `Unit`, `Rate`, `Amount`)
VALUES (1, 1, 'SAL-2026-001', 'Paddy (Rice)', 100.00, 'Quintals', 2250.00, 225000.00);

INSERT IGNORE INTO `SalesPayments` (`Id`, `SaleId`, `BuyerId`, `PaymentNo`, `PaymentDate`, `Buyer`, `SalesNo`, `PaymentAmount`, `PaymentMode`, `ReferenceNo`, `Remarks`)
VALUES (1, 1, 1, 'SPAY-2026-001', '2026-10-25 00:00:00', 'Sri Lakshmi Traders', 'SAL-2026-001', 220000.00, 'Bank', 'UTR-HDFC-99238472', 'Full settlement for Paddy harvest sales');

-- Sample Machinery
INSERT IGNORE INTO `machinery` (`Id`, `MachineName`, `MachineType`, `RegistrationNo`, `PurchaseDate`, `PurchaseCost`, `CurrentValue`, `FuelType`, `Status`) VALUES
(1, 'Mahindra 575 DI Tractor', 'Tractor', 'AP 16 BK 9821', '2024-03-15', 780000.00, 650000.00, 'Diesel', 'Active'),
(2, 'Rotavator 6 Feet', 'Implements', 'REG-ROTA-002', '2024-05-10', 125000.00, 105000.00, 'PTO Driven', 'Active'),
(3, 'Battery Knapsack Sprayer', 'Sprayer', 'REG-SPRAY-01', '2025-01-20', 8500.00, 7000.00, 'Electric Battery', 'Active');

-- ----------------------------------------------------------
-- 14. ADMIN USER REPLACEMENT & CLEANUP
-- ----------------------------------------------------------
-- Remove old Niranjan user
DELETE FROM `users` WHERE `Email` = 'niranjanvechalapu9398@gmail.com';

-- Move or remove USR-001 so Prathap is USR-001
DELETE FROM `users` WHERE `UserCode` = 'USR-001' OR `Email` = 'gprathap922@gmail.com';

INSERT INTO `users` (`UserCode`, `Name`, `Email`, `MobileNumber`, `PasswordHash`, `IsActive`, `IsDeleted`, `CreatedAt`)
VALUES ('USR-001', 'Prathap G', 'gprathap922@gmail.com', '+91 98491 23456', '$2a$11$q9p5Gz7k/bCjZz8Yp1wA2uL2xK5gW0pQv9l6oG1g0Z4k2E8aR/O4x', 1, 0, NOW());

-- Assign Administrator Role (RoleId = 1) to Prathap G
INSERT IGNORE INTO `user_roles` (`UserId`, `RoleId`)
SELECT `Id`, 1 FROM `users` WHERE `Email` = 'gprathap922@gmail.com';

SET FOREIGN_KEY_CHECKS = 1;
