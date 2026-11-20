-- ============================================================================
-- AGRIMAN - Module 10: Sales Management (MySQL 8.0+)
-- Tables: Buyers, Sales, SalesItems, SalesPayments
-- Target Database: agriman_db
-- ============================================================================

USE `agriman_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Buyers / Customers Table
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

-- 2. Sales Header Table
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

-- 3. Sales Line Items Table
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

-- 4. Sales Payments / Receipts Table
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

-- Seed Sample Buyers
INSERT IGNORE INTO `Buyers` (`Id`, `BuyerCode`, `BuyerName`, `Mobile`, `Address`, `BusinessName`, `Gstin`, `OpeningBalance`, `Status`) VALUES
(1, 'BUY-001', 'Sri Lakshmi Traders', '9876543210', 'Main Market Yard, Vijayawada, Andhra Pradesh', 'Sri Lakshmi Agri Traders', '37ABCDE1234F1Z5', 25000.00, 'Active'),
(2, 'BUY-002', 'Dairy Cooperative Society', '9876512340', 'Milk Chilling Centre, Guntur, Andhra Pradesh', 'Guntur Milk Producers Union', '37FGHIJ5678K1Z2', 0.00, 'Active'),
(3, 'BUY-003', 'Hyderabad Wholesale Mandi', '9849011223', 'Bowenpally Market Yard, Secunderabad, Telangana', 'Telangana Agro Mandi Pvt Ltd', '36AAACT9876Q1Z9', 15000.00, 'Active'),
(4, 'BUY-004', 'Kisan Export & Trading Co', '9988776655', 'APMC Market Complex, Kurnool, Andhra Pradesh', 'Kisan Export Commercial Ventures', '37KLMNO4321P1Z4', 0.00, 'Active'),
(5, 'BUY-005', 'Annapurna Rice Millers', '9848022334', 'Industrial Estate, Miryalaguda, Telangana', 'Annapurna Grain Processors Ltd', '36PQRS7890R1Z8', 50000.00, 'Active');

-- Seed Sample Sales
INSERT IGNORE INTO `Sales` (`Id`, `SalesNo`, `SalesDate`, `BuyerId`, `Buyer`, `Farm`, `Crop`, `Quantity`, `Unit`, `Rate`, `GrossAmount`, `Commission`, `Transport`, `NetAmount`, `PaymentStatus`, `Remarks`) VALUES
(1, 'SAL-2026-001', '2026-10-25 00:00:00', 1, 'Sri Lakshmi Traders', 'Sunrise Valley Farm', 'Paddy (Rice)', 100.00, 'Quintals', 2250.00, 225000.00, 2000.00, 3000.00, 220000.00, 'Paid', 'Kharif Paddy harvest lot'),
(2, 'SAL-2026-002', '2026-11-05 00:00:00', 3, 'Hyderabad Wholesale Mandi', 'Green Hills Orchard', 'Organic Tomatoes', 2500.00, 'kg', 32.00, 80000.00, 1600.00, 2400.00, 76000.00, 'Partially Paid', 'Grade-A fresh tomatoes dispatched to Bowenpally mandi'),
(3, 'SAL-2026-003', '2026-11-10 00:00:00', 5, 'Annapurna Rice Millers', 'North Field Farm', 'Maize', 80.00, 'Quintals', 2150.00, 172000.00, 2000.00, 3500.00, 166500.00, 'Pending', 'Dried yellow maize grain'),
(4, 'SAL-2026-004', '2026-11-12 00:00:00', 2, 'Dairy Cooperative Society', 'East Lake Farm', 'Chilli', 45.00, 'Quintals', 16500.00, 742500.00, 7500.00, 6000.00, 729000.00, 'Partially Paid', 'Guntur Teja dried red chilli'),
(5, 'SAL-2026-005', '2026-11-15 00:00:00', 4, 'Kisan Export & Trading Co', 'Sunrise Valley Farm', 'Cotton', 60.00, 'Quintals', 7200.00, 432000.00, 4500.00, 4000.00, 423500.00, 'Paid', 'Long-staple cotton bales');

-- Seed Sample Sales Items
INSERT IGNORE INTO `SalesItems` (`Id`, `SaleId`, `SalesNo`, `Crop`, `Quantity`, `Unit`, `Rate`, `Amount`) VALUES
(1, 1, 'SAL-2026-001', 'Paddy (Rice)', 100.00, 'Quintals', 2250.00, 225000.00),
(2, 2, 'SAL-2026-002', 'Organic Tomatoes', 2500.00, 'kg', 32.00, 80000.00),
(3, 3, 'SAL-2026-003', 'Maize', 80.00, 'Quintals', 2150.00, 172000.00),
(4, 4, 'SAL-2026-004', 'Chilli', 45.00, 'Quintals', 16500.00, 742500.00),
(5, 5, 'SAL-2026-005', 'Cotton', 60.00, 'Quintals', 7200.00, 432000.00);

-- Seed Sample Sales Payments
INSERT IGNORE INTO `SalesPayments` (`Id`, `SaleId`, `BuyerId`, `PaymentNo`, `PaymentDate`, `Buyer`, `SalesNo`, `PaymentAmount`, `PaymentMode`, `ReferenceNo`, `Remarks`) VALUES
(1, 1, 1, 'SPAY-2026-001', '2026-10-25 00:00:00', 'Sri Lakshmi Traders', 'SAL-2026-001', 220000.00, 'Bank', 'UTR-HDFC-99238472', 'Full settlement for Paddy harvest sales'),
(2, 2, 3, 'SPAY-2026-002', '2026-11-07 00:00:00', 'Hyderabad Wholesale Mandi', 'SAL-2026-002', 40000.00, 'UPI', 'UPI-HYD-88291024', 'Advance received via UPI for tomato shipment'),
(3, 4, 2, 'SPAY-2026-003', '2026-11-14 00:00:00', 'Dairy Cooperative Society', 'SAL-2026-004', 350000.00, 'Bank', 'NEFT-SBI-44019283', 'First installment for Chilli crop sale'),
(4, 5, 4, 'SPAY-2026-004', '2026-11-17 00:00:00', 'Kisan Export & Trading Co', 'SAL-2026-005', 423500.00, 'Bank', 'RTGS-CAN-55829104', 'Full clearance for cotton lot');

SET FOREIGN_KEY_CHECKS = 1;
