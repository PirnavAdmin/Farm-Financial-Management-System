-- ==========================================================
-- AGRIMAN - Farm Financial Management System
-- Complete MySQL Database Setup Script
-- Compatible with MySQL 8.0+ / MySQL Workbench
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `agriman_db`
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `agriman_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------
-- 1. Users, Auth & Roles Module
-- ----------------------------------------------------------

DROP TABLE IF EXISTS `password_resets`;
DROP TABLE IF EXISTS `refresh_tokens`;
DROP TABLE IF EXISTS `user_permissions`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `login_history`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `company_settings`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `UserCode` VARCHAR(20) NOT NULL UNIQUE,
    `Name` VARCHAR(100) NOT NULL,
    `Email` VARCHAR(150) NOT NULL UNIQUE,
    `MobileNumber` VARCHAR(25) DEFAULT NULL,
    `PasswordHash` VARCHAR(255) NOT NULL,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    `IsDeleted` TINYINT(1) NOT NULL DEFAULT 0,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `LastLoginAt` DATETIME DEFAULT NULL,
    `ProfilePhoto` LONGTEXT DEFAULT NULL,
    `PasswordResetToken` VARCHAR(100) DEFAULT NULL,
    `ResetTokenExpires` DATETIME DEFAULT NULL,
    INDEX `idx_users_email` (`Email`),
    INDEX `idx_users_usercode` (`UserCode`),
    INDEX `idx_users_isactive` (`IsActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `roles` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Name` VARCHAR(50) NOT NULL UNIQUE,
    `Description` VARCHAR(250) DEFAULT NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `permissions` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Name` VARCHAR(100) NOT NULL UNIQUE,
    `Description` VARCHAR(250) DEFAULT NULL,
    `Module` VARCHAR(50) NOT NULL DEFAULT 'General'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_roles` (
    `UserId` INT NOT NULL,
    `RoleId` INT NOT NULL,
    PRIMARY KEY (`UserId`, `RoleId`),
    CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`RoleId`) REFERENCES `roles` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `role_permissions` (
    `RoleId` INT NOT NULL,
    `PermissionId` INT NOT NULL,
    PRIMARY KEY (`RoleId`, `PermissionId`),
    CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`RoleId`) REFERENCES `roles` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`PermissionId`) REFERENCES `permissions` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_permissions` (
    `UserId` INT NOT NULL,
    `PermissionId` INT NOT NULL,
    PRIMARY KEY (`UserId`, `PermissionId`),
    CONSTRAINT `fk_user_permissions_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_permissions_permission` FOREIGN KEY (`PermissionId`) REFERENCES `permissions` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `login_history` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `UserId` INT DEFAULT NULL,
    `Email` VARCHAR(150) DEFAULT NULL,
    `Identifier` VARCHAR(150) DEFAULT NULL,
    `LoginAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `Status` VARCHAR(30) NOT NULL DEFAULT 'Success',
    `IpAddress` VARCHAR(60) DEFAULT NULL,
    `UserAgent` VARCHAR(300) DEFAULT NULL,
    `RememberMe` TINYINT(1) NOT NULL DEFAULT 0,
    `FailureReason` VARCHAR(250) DEFAULT NULL,
    CONSTRAINT `fk_login_history_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_resets` (
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

CREATE TABLE `audit_logs` (
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

CREATE TABLE `company_settings` (
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

CREATE TABLE `refresh_tokens` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `UserId` INT NOT NULL,
    `Token` VARCHAR(255) NOT NULL,
    `ExpiresAt` DATETIME NOT NULL,
    `IsRevoked` TINYINT(1) NOT NULL DEFAULT 0,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 2. Farmer & Farm Land Management
-- ----------------------------------------------------------

DROP TABLE IF EXISTS `farm_land_details`;
DROP TABLE IF EXISTS `farms`;
DROP TABLE IF EXISTS `farmer_bank_accounts`;
DROP TABLE IF EXISTS `farmer_addresses`;
DROP TABLE IF EXISTS `farmers`;

CREATE TABLE `farmers` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `FarmerCode` VARCHAR(50) NOT NULL UNIQUE,
    `FarmerName` VARCHAR(150) NOT NULL,
    `FatherSpouseName` VARCHAR(150) DEFAULT NULL,
    `Mobile` VARCHAR(15) NOT NULL,
    `AlternateMobile` VARCHAR(15) DEFAULT NULL,
    `Email` VARCHAR(120) DEFAULT NULL,
    `AadhaarNo` VARCHAR(20) DEFAULT NULL,
    `Village` VARCHAR(100) DEFAULT '',
    `Mandal` VARCHAR(100) DEFAULT '',
    `District` VARCHAR(100) DEFAULT '',
    `State` VARCHAR(100) NOT NULL DEFAULT 'Andhra Pradesh',
    `PinCode` VARCHAR(10) DEFAULT NULL,
    `TotalLandAcres` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    `Status` VARCHAR(20) NOT NULL DEFAULT 'Active',
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_farmer_code` (`FarmerCode`),
    INDEX `idx_farmer_mobile` (`Mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `farmer_addresses` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `FarmerId` INT NOT NULL,
    `AddressType` VARCHAR(50) NOT NULL DEFAULT 'Permanent',
    `DoorNo` VARCHAR(50) DEFAULT NULL,
    `Street` VARCHAR(150) DEFAULT NULL,
    `Village` VARCHAR(100) DEFAULT '',
    `Mandal` VARCHAR(100) DEFAULT '',
    `District` VARCHAR(100) DEFAULT '',
    `State` VARCHAR(100) NOT NULL,
    `PinCode` VARCHAR(10) DEFAULT NULL,
    CONSTRAINT `fk_farmer_addresses_farmer` FOREIGN KEY (`FarmerId`) REFERENCES `farmers` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `farmer_bank_accounts` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `FarmerId` INT NOT NULL,
    `BankName` VARCHAR(120) NOT NULL,
    `BranchName` VARCHAR(100) DEFAULT NULL,
    `AccountNumber` VARCHAR(50) NOT NULL,
    `IfscCode` VARCHAR(20) NOT NULL,
    `AccountHolderName` VARCHAR(150) NOT NULL,
    `IsPrimary` TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT `fk_farmer_bank_farmer` FOREIGN KEY (`FarmerId`) REFERENCES `farmers` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `farms` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `FarmerId` INT NOT NULL,
    `FarmName` VARCHAR(150) NOT NULL,
    `SurveyNumber` VARCHAR(100) DEFAULT NULL,
    `LandArea` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    `AreaUnit` VARCHAR(20) NOT NULL DEFAULT 'Acres',
    `LandType` VARCHAR(50) NOT NULL DEFAULT 'Wetland',
    `OwnershipType` VARCHAR(50) NOT NULL DEFAULT 'Owned',
    `Village` VARCHAR(100) DEFAULT '',
    `Mandal` VARCHAR(100) DEFAULT '',
    `District` VARCHAR(100) DEFAULT '',
    `IrrigationType` VARCHAR(100) NOT NULL DEFAULT 'Borewell',
    `SoilType` VARCHAR(100) NOT NULL DEFAULT 'Black Soil',
    `Status` VARCHAR(20) NOT NULL DEFAULT 'Active',
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_farms_farmer` FOREIGN KEY (`FarmerId`) REFERENCES `farmers` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 3. Crop & Season Management
-- ----------------------------------------------------------

DROP TABLE IF EXISTS `crop_seasons`;
DROP TABLE IF EXISTS `crops`;
DROP TABLE IF EXISTS `crop_categories`;

CREATE TABLE `crop_categories` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `CategoryName` VARCHAR(100) NOT NULL UNIQUE,
    `Description` VARCHAR(250) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `crops` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `CategoryId` INT DEFAULT NULL,
    `CropCode` VARCHAR(50) NOT NULL UNIQUE,
    `CropName` VARCHAR(100) NOT NULL,
    `CropType` VARCHAR(50) NOT NULL DEFAULT 'Kharif',
    `DefaultUnit` VARCHAR(20) NOT NULL DEFAULT 'Bags',
    `DurationDays` INT DEFAULT 120,
    `Status` VARCHAR(20) NOT NULL DEFAULT 'Active',
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_crops_category` FOREIGN KEY (`CategoryId`) REFERENCES `crop_categories` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `crop_seasons` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `FarmId` INT NOT NULL,
    `CropId` INT NOT NULL,
    `SeasonName` VARCHAR(100) NOT NULL, -- e.g. "Kharif 2026"
    `SowingDate` DATE NOT NULL,
    `ExpectedHarvestDate` DATE DEFAULT NULL,
    `ActualHarvestDate` DATE DEFAULT NULL,
    `AreaAcres` DECIMAL(8, 2) NOT NULL,
    `ExpectedYield` DECIMAL(10, 2) DEFAULT NULL,
    `ExpectedRevenue` DECIMAL(12, 2) DEFAULT NULL,
    `ActualYield` DECIMAL(10, 2) DEFAULT NULL,
    `ActualRevenue` DECIMAL(12, 2) DEFAULT NULL,
    `Status` VARCHAR(30) NOT NULL DEFAULT 'In Progress',
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_crop_seasons_farm` FOREIGN KEY (`FarmId`) REFERENCES `farms` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `fk_crop_seasons_crop` FOREIGN KEY (`CropId`) REFERENCES `crops` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 4. Labour Management Module
-- ----------------------------------------------------------

DROP TABLE IF EXISTS `labour_payments`;
DROP TABLE IF EXISTS `labour_attendance`;
DROP TABLE IF EXISTS `labour_work_types`;
DROP TABLE IF EXISTS `labours`;

CREATE TABLE `labours` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `labour_code` VARCHAR(50) NOT NULL UNIQUE,
    `labour_name` VARCHAR(150) NOT NULL,
    `mobile` VARCHAR(15) NOT NULL,
    `gender` ENUM('Male', 'Female', 'Other') NOT NULL DEFAULT 'Male',
    `village` VARCHAR(100) NOT NULL,
    `daily_rate` DECIMAL(10, 2) NOT NULL DEFAULT 400.00,
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    `photo` LONGTEXT DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_labours_code` (`labour_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `labour_work_types` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `work_type_name` VARCHAR(100) NOT NULL,
    `default_rate` DECIMAL(10, 2) NOT NULL DEFAULT 450.00,
    `unit` VARCHAR(20) NOT NULL DEFAULT 'Day',
    `description` TEXT DEFAULT NULL,
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `labour_attendance` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `attendance_code` VARCHAR(50) NOT NULL UNIQUE,
    `attendance_date` DATE NOT NULL,
    `labour_id` BIGINT UNSIGNED NOT NULL,
    `farm_name` VARCHAR(100) NOT NULL,
    `crop_name` VARCHAR(100) NOT NULL,
    `work_type` VARCHAR(100) NOT NULL,
    `work_basis` ENUM('Days', 'Hours') NOT NULL DEFAULT 'Days',
    `units_worked` DECIMAL(6, 2) NOT NULL DEFAULT 1.00,
    `rate` DECIMAL(10, 2) NOT NULL,
    `calculated_amount` DECIMAL(10, 2) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_labour_attendance_labour` FOREIGN KEY (`labour_id`) REFERENCES `labours` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `labour_payments` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `payment_code` VARCHAR(50) NOT NULL UNIQUE,
    `payment_date` DATE NOT NULL,
    `labour_id` BIGINT UNSIGNED NOT NULL,
    `amount_paid` DECIMAL(10, 2) NOT NULL,
    `payment_mode` ENUM('Cash', 'Bank Transfer', 'UPI', 'Cheque') NOT NULL DEFAULT 'Cash',
    `reference_no` VARCHAR(100) DEFAULT NULL,
    `period_start` DATE DEFAULT NULL,
    `period_end` DATE DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_labour_payments_labour` FOREIGN KEY (`labour_id`) REFERENCES `labours` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 5. Supplier Management Module
-- ----------------------------------------------------------

DROP TABLE IF EXISTS `supplier_payments`;
DROP TABLE IF EXISTS `supplier_transactions`;
DROP TABLE IF EXISTS `suppliers`;

CREATE TABLE `suppliers` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `supplier_code` VARCHAR(50) NOT NULL UNIQUE,
    `supplier_name` VARCHAR(150) NOT NULL,
    `supplier_type` VARCHAR(100) NOT NULL DEFAULT 'General',
    `mobile` VARCHAR(15) NOT NULL,
    `email` VARCHAR(120) DEFAULT NULL,
    `address` TEXT NOT NULL,
    `city` VARCHAR(100) DEFAULT NULL,
    `district` VARCHAR(100) DEFAULT NULL,
    `state` VARCHAR(100) DEFAULT NULL,
    `pin_code` VARCHAR(10) DEFAULT NULL,
    `gstin` VARCHAR(20) DEFAULT NULL,
    `bank_name` VARCHAR(120) DEFAULT NULL,
    `account_number` VARCHAR(50) DEFAULT NULL,
    `ifsc_code` VARCHAR(20) DEFAULT NULL,
    `branch_name` VARCHAR(100) DEFAULT NULL,
    `opening_balance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    `notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `supplier_transactions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `transaction_code` VARCHAR(50) NOT NULL UNIQUE,
    `transaction_date` DATE NOT NULL,
    `supplier_id` BIGINT UNSIGNED NOT NULL,
    `supplier_name` VARCHAR(150) NOT NULL,
    `transaction_type` ENUM('Purchase', 'Bill', 'Opening Balance', 'Debit Note', 'Credit Note') NOT NULL DEFAULT 'Purchase',
    `reference_no` VARCHAR(100) DEFAULT NULL,
    `category` VARCHAR(100) DEFAULT NULL,
    `items_summary` TEXT DEFAULT NULL,
    `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `paid_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `balance_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `payment_status` ENUM('Paid', 'Partially Paid', 'Pending', 'Overdue') NOT NULL DEFAULT 'Pending',
    `notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_supplier_trans_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `supplier_payments` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `payment_code` VARCHAR(50) NOT NULL UNIQUE,
    `payment_date` DATE NOT NULL,
    `supplier_id` BIGINT UNSIGNED NOT NULL,
    `supplier_name` VARCHAR(150) NOT NULL,
    `amount_paid` DECIMAL(12, 2) NOT NULL,
    `payment_mode` ENUM('Bank Transfer', 'UPI', 'Cheque', 'Cash', 'NEFT/RTGS') NOT NULL DEFAULT 'Bank Transfer',
    `reference_no` VARCHAR(100) DEFAULT NULL,
    `bank_account` VARCHAR(120) DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_supplier_pay_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 6. Income & Expenditure Finance Module
-- ----------------------------------------------------------

DROP TABLE IF EXISTS `expense_transactions`;
DROP TABLE IF EXISTS `expense_categories`;
DROP TABLE IF EXISTS `income_transactions`;
DROP TABLE IF EXISTS `income_categories`;

CREATE TABLE `income_categories` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `CategoryName` VARCHAR(100) NOT NULL UNIQUE,
    `Description` VARCHAR(250) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `income_transactions` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `IncomeNo` VARCHAR(50) NOT NULL UNIQUE,
    `IncomeDate` DATE NOT NULL,
    `FarmerId` INT DEFAULT NULL,
    `FarmId` INT DEFAULT NULL,
    `CropId` INT DEFAULT NULL,
    `CategoryId` INT NOT NULL,
    `BuyerName` VARCHAR(150) DEFAULT NULL,
    `Amount` DECIMAL(12, 2) NOT NULL,
    `PaymentMode` VARCHAR(50) NOT NULL DEFAULT 'Cash',
    `ReferenceNo` VARCHAR(100) DEFAULT NULL,
    `Remarks` TEXT DEFAULT NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_income_farmer` FOREIGN KEY (`FarmerId`) REFERENCES `farmers` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `fk_income_farm` FOREIGN KEY (`FarmId`) REFERENCES `farms` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `fk_income_crop` FOREIGN KEY (`CropId`) REFERENCES `crops` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `fk_income_category` FOREIGN KEY (`CategoryId`) REFERENCES `income_categories` (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `expense_categories` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `CategoryName` VARCHAR(100) NOT NULL UNIQUE,
    `Description` VARCHAR(250) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `expense_transactions` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `ExpenseNo` VARCHAR(50) NOT NULL UNIQUE,
    `ExpenseDate` DATE NOT NULL,
    `FarmerId` INT DEFAULT NULL,
    `FarmId` INT DEFAULT NULL,
    `CropId` INT DEFAULT NULL,
    `CategoryId` INT NOT NULL,
    `SupplierName` VARCHAR(150) DEFAULT NULL,
    `Description` VARCHAR(255) DEFAULT NULL,
    `Amount` DECIMAL(12, 2) NOT NULL,
    `PaymentMode` VARCHAR(50) NOT NULL DEFAULT 'Cash',
    `ReferenceNo` VARCHAR(100) DEFAULT NULL,
    `Remarks` TEXT DEFAULT NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_expense_farmer` FOREIGN KEY (`FarmerId`) REFERENCES `farmers` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `fk_expense_farm` FOREIGN KEY (`FarmId`) REFERENCES `farms` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `fk_expense_crop` FOREIGN KEY (`CropId`) REFERENCES `crops` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `fk_expense_category` FOREIGN KEY (`CategoryId`) REFERENCES `expense_categories` (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 7. Inventory & Products
-- ----------------------------------------------------------

DROP TABLE IF EXISTS `stock_adjustments`;
DROP TABLE IF EXISTS `inventory_transactions`;
DROP TABLE IF EXISTS `inventory`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `units`;
DROP TABLE IF EXISTS `product_categories`;

CREATE TABLE `product_categories` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Name` VARCHAR(100) NOT NULL UNIQUE,
    `Description` VARCHAR(250) DEFAULT NULL,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    INDEX `idx_pc_name` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `units` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Name` VARCHAR(50) NOT NULL,
    `ShortCode` VARCHAR(20) NOT NULL UNIQUE,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    INDEX `idx_units_code` (`ShortCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `products` (
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
    CONSTRAINT `fk_products_category` FOREIGN KEY (`CategoryId`) REFERENCES `product_categories` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_products_units` FOREIGN KEY (`UnitId`) REFERENCES `units` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inventory` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `ProductId` INT NOT NULL,
    `StorageLocation` VARCHAR(100) NOT NULL DEFAULT 'Main Warehouse',
    `CurrentStock` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `ReservedStock` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `LastUpdated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `ux_inventory_product_loc` (`ProductId`, `StorageLocation`),
    CONSTRAINT `fk_inventory_product` FOREIGN KEY (`ProductId`) REFERENCES `products` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inventory_transactions` (
    `Id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `ProductId` INT NOT NULL,
    `TransactionDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `TransactionType` VARCHAR(50) NOT NULL,
    `Quantity` DECIMAL(18, 2) NOT NULL,
    `UnitPrice` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `StorageLocation` VARCHAR(100) NOT NULL DEFAULT 'Main Warehouse',
    `ReferenceType` VARCHAR(50) DEFAULT NULL,
    `ReferenceNumber` VARCHAR(100) DEFAULT NULL,
    `Notes` VARCHAR(500) DEFAULT NULL,
    `BalanceAfterTransaction` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    INDEX `idx_inv_tx_product` (`ProductId`),
    CONSTRAINT `fk_inv_tx_products` FOREIGN KEY (`ProductId`) REFERENCES `products` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `stock_adjustments` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `AdjustmentNumber` VARCHAR(50) NOT NULL UNIQUE,
    `AdjustmentDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `ProductId` INT NOT NULL,
    `StorageLocation` VARCHAR(100) NOT NULL DEFAULT 'Main Warehouse',
    `BookStock` DECIMAL(18, 2) NOT NULL,
    `PhysicalStock` DECIMAL(18, 2) NOT NULL,
    `Reason` VARCHAR(250) NOT NULL,
    `Remarks` VARCHAR(500) DEFAULT NULL,
    `AdjustmentType` VARCHAR(50) DEFAULT NULL,
    `ApprovedBy` VARCHAR(100) DEFAULT NULL,
    INDEX `idx_stock_adj_product` (`ProductId`),
    CONSTRAINT `fk_stock_adj_products` FOREIGN KEY (`ProductId`) REFERENCES `products` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Default Categories
INSERT INTO `product_categories` (`Id`, `Name`, `Description`, `IsActive`) VALUES
(1, 'Seeds', 'Agricultural crop seeds, hybrid varieties, and certified saplings', 1),
(2, 'Fertilizers', 'Chemical, organic, and complex plant nutrients', 1),
(3, 'Pesticides', 'Chemical insecticides, fungicides, and herbicides for pest control', 1),
(4, 'Sprayer Chemicals', 'Specialized liquid sprays, adjuvants, and micronutrients', 1),
(5, 'Spare Parts', 'Tractor, tiller, irrigation pump, and sprayer spare parts', 1),
(6, 'Consumables', 'Drip lateral pipes, ropes, tarpaulins, and farm consumables', 1)
ON DUPLICATE KEY UPDATE `Description` = VALUES(`Description`), `IsActive` = VALUES(`IsActive`);

-- Seed Default Units
INSERT INTO `units` (`Id`, `Name`, `ShortCode`, `IsActive`) VALUES
(1, 'Kilograms', 'kg', 1),
(2, 'Bags', 'Bags', 1),
(3, 'Litre', 'Litre', 1),
(4, 'Quintals', 'Quintals', 1),
(5, 'Packets', 'Packets', 1)
ON DUPLICATE KEY UPDATE `Name` = VALUES(`Name`), `IsActive` = VALUES(`IsActive`);

-- ----------------------------------------------------------
-- 8. Buyers & Sales
-- ----------------------------------------------------------

DROP TABLE IF EXISTS `sales`;
DROP TABLE IF EXISTS `buyers`;

CREATE TABLE `buyers` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `BuyerCode` VARCHAR(50) NOT NULL UNIQUE,
    `BuyerName` VARCHAR(150) NOT NULL,
    `Mobile` VARCHAR(15) NOT NULL,
    `Address` TEXT DEFAULT NULL,
    `BusinessName` VARCHAR(150) DEFAULT NULL,
    `Gstin` VARCHAR(20) DEFAULT NULL,
    `OpeningBalance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `Status` VARCHAR(20) NOT NULL DEFAULT 'Active',
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sales` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `SaleNo` VARCHAR(50) NOT NULL UNIQUE,
    `SaleDate` DATE NOT NULL,
    `BuyerId` INT NOT NULL,
    `FarmId` INT DEFAULT NULL,
    `CropId` INT DEFAULT NULL,
    `Quantity` DECIMAL(10, 2) NOT NULL,
    `Unit` VARCHAR(20) NOT NULL DEFAULT 'Quintals',
    `Rate` DECIMAL(10, 2) NOT NULL,
    `GrossAmount` DECIMAL(12, 2) NOT NULL,
    `NetAmount` DECIMAL(12, 2) NOT NULL,
    `PaymentStatus` VARCHAR(30) NOT NULL DEFAULT 'Pending',
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_sales_buyer` FOREIGN KEY (`BuyerId`) REFERENCES `buyers` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sales_farm` FOREIGN KEY (`FarmId`) REFERENCES `farms` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `fk_sales_crop` FOREIGN KEY (`CropId`) REFERENCES `crops` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- 9. SEED DATA (Pre-populated Master & Demo Data)
-- ==========================================================

-- Permissions
INSERT INTO `permissions` (`Name`, `Description`, `Module`) VALUES
('users.view', 'View system users and details', 'Users'),
('users.create', 'Create new system users', 'Users'),
('users.edit', 'Edit existing users', 'Users'),
('users.delete', 'Soft-delete users', 'Users'),
('users.status', 'Activate or deactivate user accounts', 'Users'),
('users.roles', 'Assign roles to users', 'Users'),
('roles.view', 'View roles and access rules', 'Roles'),
('roles.manage', 'Create and modify roles', 'Roles'),
('company.view', 'View organization details', 'Company'),
('company.manage', 'Manage company profile and settings', 'Company'),
('audit.view', 'View security audit logs and login history', 'Audit'),
('agriculture.view', 'View crops, plots, and farm cycles', 'Agriculture'),
('agriculture.manage', 'Manage agricultural plans and harvest', 'Agriculture'),
('finance.view', 'View transactions, ledgers, and accounts', 'Finance'),
('finance.manage', 'Manage farm invoices, payroll, and expenses', 'Finance'),
('inventory.view', 'View fertilizers, seeds, and equipment stock', 'Inventory'),
('inventory.manage', 'Stock intake, issuance, and adjustments', 'Inventory'),
('reports.view', 'Generate and export business intelligence reports', 'Reports');

-- Roles
INSERT INTO `roles` (`Name`, `Description`) VALUES
('Administrator', 'Full administrative access across all farm modules and settings.'),
('Manager', 'Oversees daily farm operations, workforce, inventory, and reports.'),
('Accountant', 'Manages farm accounting, expenses, sales, invoices, and financial reports.'),
('Agronomist', 'Advises on crop health, soil preparation, planting cycles, and fertilizers.'),
('Field Supervisor', 'Monitors field laborers, machinery usage, and daily harvest logs.'),
('Technician', 'Calibrates smart sensors, drip irrigation systems, and drone telemetry.'),
('Farmer', 'Field owner and basic operator profile.');

-- Role Permissions (Administrator gets all)
INSERT INTO `role_permissions` (`RoleId`, `PermissionId`)
SELECT 1, `Id` FROM `permissions`;

-- Default Users (Password: AgriMan@2026 -> $2a$11$w1Bq/K5gP9hF3Qx/YtqTneE7yO6W7qO6W7qO6W7qO6W7qO6W7qO6W)
-- Using BCrypt hash for AgriMan@2026:
INSERT INTO `users` (`UserCode`, `Name`, `Email`, `MobileNumber`, `PasswordHash`, `IsActive`, `CreatedAt`) VALUES
('USR-001', 'Arjun Mehta', 'arjun.mehta@agriman.in', '+91 98765 43210', '$2a$11$Z5N8aUvYwUqyQ3k2E8aR/O4xR6lXy5gW0pQv9l6oG1g0Z4k2E8aR/', 1, NOW()),
('USR-002', 'Priya Sharma', 'priya.sharma@agriman.in', '+91 98765 12340', '$2a$11$Z5N8aUvYwUqyQ3k2E8aR/O4xR6lXy5gW0pQv9l6oG1g0Z4k2E8aR/', 1, NOW()),
('USR-003', 'Rahul Verma', 'rahul.verma@agriman.in', '+91 91234 56780', '$2a$11$Z5N8aUvYwUqyQ3k2E8aR/O4xR6lXy5gW0pQv9l6oG1g0Z4k2E8aR/', 1, NOW()),
('USR-004', 'Vikram Patel', 'vikram.patel@agriman.in', '+91 98220 11223', '$2a$11$Z5N8aUvYwUqyQ3k2E8aR/O4xR6lXy5gW0pQv9l6oG1g0Z4k2E8aR/', 1, NOW());

-- User Roles
INSERT INTO `user_roles` (`UserId`, `RoleId`) VALUES
(1, 1), -- Arjun Mehta -> Administrator
(2, 2), -- Priya Sharma -> Manager
(3, 3), -- Rahul Verma -> Accountant
(4, 4); -- Vikram Patel -> Agronomist

-- Company Settings
INSERT INTO `company_settings` (`CompanyName`, `Email`, `Phone`, `Address`, `City`, `TaxNumber`, `Currency`, `Timezone`, `Website`)
VALUES ('AGRIMAN Farms Pvt Ltd', 'contact@agriman.in', '+91 98765 00000', 'Plot 42, Green Agro Tech Park', 'Hyderabad', 'GSTIN36AABCA1234F1Z5', 'INR', 'Asia/Kolkata', 'https://agriman.in');

-- Labour Work Types
INSERT INTO `labour_work_types` (`code`, `work_type_name`, `default_rate`, `unit`, `description`, `status`) VALUES
('LWT-001', 'Land Preparation', 500.00, 'Day', 'Ploughing, tilling, levelling, and bed forming', 'Active'),
('LWT-002', 'Planting', 450.00, 'Day', 'Seed sowing, nursery transplantation, and dibbling', 'Active'),
('LWT-003', 'Weeding', 400.00, 'Day', 'Manual inter-cultivation and unwanted weed removal', 'Active'),
('LWT-004', 'Spraying', 550.00, 'Day', 'Foliar nutrition, biological and pesticide application', 'Active'),
('LWT-005', 'Harvesting', 500.00, 'Day', 'Crop cutting, picking, sorting, and field gathering', 'Active'),
('LWT-006', 'Loading', 450.00, 'Day', 'Loading farm produce and harvested sacks onto tractor/trucks', 'Active'),
('LWT-007', 'Unloading', 450.00, 'Day', 'Unloading fertilizer bags, seed trays, or inputs', 'Active');

-- Labours
INSERT INTO `labours` (`labour_code`, `labour_name`, `mobile`, `gender`, `village`, `daily_rate`, `status`, `notes`) VALUES
('LBR-001', 'Mallaiah Goud', '9849123401', 'Male', 'Kankipadu', 450.00, 'Active', 'Experienced in tractor driving & land preparation'),
('LBR-002', 'Lakshmi Devi', '9849123402', 'Female', 'Penamaluru', 400.00, 'Active', 'Specialized in nursery transplanting and weeding'),
('LBR-003', 'Venkatesh Naidu', '9849123403', 'Male', 'Tadikonda', 500.00, 'Active', 'Experienced knapsack sprayer and irrigation technician'),
('LBR-004', 'Parvathamma B.', '9849123404', 'Female', 'Kankipadu', 400.00, 'Active', 'Fast picker for chilli and tomato harvests');

-- Suppliers
INSERT INTO `suppliers` (`supplier_code`, `supplier_name`, `supplier_type`, `mobile`, `email`, `address`, `city`, `district`, `state`, `pin_code`, `gstin`, `bank_name`, `account_number`, `ifsc_code`, `branch_name`, `opening_balance`, `status`, `notes`) VALUES
('SUP-001', 'National Seeds Corporation', 'Seeds', '9849123410', 'contact@nationalseeds.gov.in', 'Plot 45, Industrial Estate, Autonagar', 'Vijayawada', 'Krishna', 'Andhra Pradesh', '520007', '37AABCN1234F1Z8', 'State Bank of India', '39876543210', 'SBIN0001234', 'Autonagar Branch', 15000.00, 'Active', 'Government certified foundation seeds distributor'),
('SUP-002', 'IFFCO Agro Supplies', 'Fertilizers', '9849123411', 'supplies@iffco.in', 'NH-16 Bypass Road, Tadepalli', 'Tadepalli', 'Guntur', 'Andhra Pradesh', '522501', '37AAACI2014K1Z3', 'HDFC Bank', '50200088192341', 'HDFC0000412', 'Tadepalli', 24500.00, 'Active', 'Primary cooperative supplier for chemical fertilizers and urea'),
('SUP-003', 'Coromandel Agro Chemicals', 'Fertilizers', '9849123412', 'orders@coromandel.biz', 'Fertilizer City, Coromandel Gate', 'Visakhapatnam', 'Visakhapatnam', 'Andhra Pradesh', '530014', '37AAACC4451D1ZP', 'ICICI Bank', '004205011982', 'ICIC0000042', 'Vizag Port', 0.00, 'Active', 'Phosphatic fertilizers and water soluble nutrients'),
('SUP-004', 'Bayer CropScience', 'Pesticides', '9849123413', 'care@bayercropscience.com', 'Bayer House, Central Park, BKC', 'Mumbai', 'Mumbai Suburban', 'Maharashtra', '400051', '27AAACB2188E1ZT', 'Citibank India', '0341882901', 'CITI0000002', 'BKC Mumbai', 32000.00, 'Active', 'Crop protection products, fungicides, insecticides');

-- Crop Categories & Crops
INSERT INTO `crop_categories` (`CategoryName`, `Description`) VALUES
('Cereals & Grains', 'Rice, Wheat, Maize, etc.'),
('Commercial / Cash Crops', 'Cotton, Sugarcane, Tobacco'),
('Vegetables & Horticulture', 'Tomato, Chilli, Onion'),
('Pulses & Oilseeds', 'Groundnut, Red Gram, Soya');

INSERT INTO `crops` (`CategoryId`, `CropCode`, `CropName`, `CropType`, `DefaultUnit`, `DurationDays`) VALUES
(1, 'CRP-001', 'Paddy (Rice)', 'Kharif', 'Bags (75kg)', 135),
(2, 'CRP-002', 'Cotton', 'Kharif', 'Quintals', 160),
(3, 'CRP-003', 'Chilli', 'Rabi', 'Quintals', 150),
(4, 'CRP-004', 'Groundnut', 'Kharif', 'Bags (40kg)', 110),
(1, 'CRP-005', 'Maize', 'Kharif', 'Quintals', 105),
(3, 'CRP-006', 'Tomato', 'Annual', 'Crates (25kg)', 90),
(2, 'CRP-007', 'Sugarcane', 'Annual', 'Tonnes', 330);

-- Income & Expense Categories
INSERT INTO `income_categories` (`CategoryName`, `Description`) VALUES
('Crop Sales', 'Revenue earned by selling harvested crops'),
('Government Subsidy', 'Direct benefit transfers and agricultural subsidies'),
('Rental Income', 'Leasing tractors, harvesters, or agricultural land'),
('Other Income', 'Miscellaneous farm receipts');

INSERT INTO `expense_categories` (`CategoryName`, `Description`) VALUES
('Seeds', 'Seed packets, nursery seedlings, and grafting'),
('Fertilizers', 'Urea, DAP, Potash, organic manure, vermicompost'),
('Pesticides', 'Insecticides, fungicides, weedicides'),
('Labour Wages', 'Daily agricultural labour payments'),
('Machinery & Fuel', 'Diesel, tractor rental, maintenance & repair'),
('Irrigation & Electricity', 'Borewell repair, motor electricity, drip lines'),
('Harvesting & Transport', 'Post-harvest cutting, loading, transport to market'),
('Other Expenses', 'Miscellaneous operational costs');

-- Sample Farmer & Farm
INSERT INTO `farmers` (`FarmerCode`, `FarmerName`, `FatherSpouseName`, `Mobile`, `Village`, `Mandal`, `District`, `State`, `TotalLandAcres`, `Status`) VALUES
('FMR-001', 'Shyam Reddy', 'Venkat Reddy', '9849100001', 'Kankipadu', 'Kankipadu', 'Krishna', 'Andhra Pradesh', 8.00, 'Active');

INSERT INTO `farms` (`FarmerId`, `FarmName`, `SurveyNumber`, `LandArea`, `AreaUnit`, `LandType`, `OwnershipType`, `Village`, `Mandal`, `District`, `IrrigationType`, `SoilType`) VALUES
(1, 'Farm 1 (North Block)', '123/A', 5.00, 'Acres', 'Wetland', 'Owned', 'Kankipadu', 'Kankipadu', 'Krishna', 'Borewell', 'Black Soil'),
(1, 'Farm 2 (Canal Block)', '125/B', 3.00, 'Acres', 'Wetland', 'Owned', 'Kankipadu', 'Kankipadu', 'Krishna', 'Canal', 'Alluvial Soil');

-- Sample Crop Season
INSERT INTO `crop_seasons` (`FarmId`, `CropId`, `SeasonName`, `SowingDate`, `ExpectedHarvestDate`, `AreaAcres`, `ExpectedYield`, `ExpectedRevenue`, `Status`) VALUES
(1, 1, 'Kharif 2026', '2026-06-15', '2026-10-30', 5.00, 150.00, 450000.00, 'In Progress'),
(2, 2, 'Kharif 2026', '2026-07-01', '2026-12-15', 3.00, 45.00, 315000.00, 'In Progress');
