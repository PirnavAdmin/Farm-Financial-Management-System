using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AgriMan.Unified.Api.Migrations.Farms
{
    /// <inheritdoc />
    public partial class InitialMySqlFarmUnified : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            // Idempotent MySQL 8.0 DDL so this migration succeeds on both fresh and pre-existing agriman_db instances.
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS `bank_accounts` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `BankName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `AccountName` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `AccountNumber` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Ifsc` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Branch` longtext CHARACTER SET utf8mb4 NOT NULL,
    `AccountType` longtext CHARACTER SET utf8mb4 NOT NULL,
    `OpeningBalance` decimal(65,30) NOT NULL,
    `CurrentBalance` decimal(65,30) NOT NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NULL,
    CONSTRAINT `PK_bank_accounts` PRIMARY KEY (`Id`),
    KEY `IX_bank_accounts_AccountName` (`AccountName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crop_categories` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `CategoryName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Description` varchar(250) CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_crop_categories` PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `farmers` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `FarmerCode` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `FarmerName` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `FatherOrHusbandName` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Mobile` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `AlternateMobile` varchar(20) CHARACTER SET utf8mb4 NULL,
    `Email` varchar(100) CHARACTER SET utf8mb4 NULL,
    `AadhaarNo` varchar(20) CHARACTER SET utf8mb4 NULL,
    `Village` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Mandal` varchar(100) CHARACTER SET utf8mb4 NULL,
    `District` varchar(100) CHARACTER SET utf8mb4 NULL,
    `TotalLand` decimal(18,2) NOT NULL,
    `Status` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Active',
    `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` datetime(6) NULL,
    CONSTRAINT `PK_farmers` PRIMARY KEY (`Id`),
    UNIQUE KEY `IX_farmers_FarmerCode` (`FarmerCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `finance_payments` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `PaymentNo` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `Date` datetime(6) NOT NULL,
    `Party` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `PaymentType` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Purpose` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `Category` varchar(120) CHARACTER SET utf8mb4 NOT NULL,
    `PayeeType` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `ContactInfo` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Farm` varchar(150) CHARACTER SET utf8mb4 NULL,
    `FieldParcel` varchar(120) CHARACTER SET utf8mb4 NULL,
    `Crop` varchar(120) CHARACTER SET utf8mb4 NULL,
    `Season` varchar(100) CHARACTER SET utf8mb4 NULL,
    `RefType` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `ReferenceTransaction` varchar(100) CHARACTER SET utf8mb4 NULL,
    `OriginalAmount` decimal(18,2) NOT NULL,
    `OutstandingAmount` decimal(18,2) NOT NULL,
    `Amount` decimal(18,2) NOT NULL,
    `AdditionalCharges` decimal(18,2) NOT NULL,
    `Discount` decimal(18,2) NOT NULL,
    `TotalAmount` decimal(18,2) NOT NULL,
    `PaymentMode` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `BankAccountId` int NULL,
    `BankAccount` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `ReferenceNo` varchar(100) CHARACTER SET utf8mb4 NULL,
    `ChequeNo` varchar(100) CHARACTER SET utf8mb4 NULL,
    `ChequeDate` datetime(6) NULL,
    `SupplierId` bigint NULL,
    `LabourId` int NULL,
    `Remarks` varchar(500) CHARACTER SET utf8mb4 NULL,
    `Status` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `CancellationReason` varchar(300) CHARACTER SET utf8mb4 NULL,
    `CancelledAt` datetime(6) NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NULL,
    CONSTRAINT `PK_finance_payments` PRIMARY KEY (`Id`),
    KEY `IX_finance_payments_Date` (`Date`),
    KEY `IX_finance_payments_PaymentMode` (`PaymentMode`),
    UNIQUE KEY `IX_finance_payments_PaymentNo` (`PaymentNo`),
    KEY `IX_finance_payments_Status` (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `finance_receipts` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `ReceiptNo` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `Date` datetime(6) NOT NULL,
    `From` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `Purpose` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `Category` varchar(120) CHARACTER SET utf8mb4 NOT NULL,
    `PayerType` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `ContactInfo` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Farm` varchar(150) CHARACTER SET utf8mb4 NULL,
    `FieldParcel` varchar(120) CHARACTER SET utf8mb4 NULL,
    `Crop` varchar(120) CHARACTER SET utf8mb4 NULL,
    `Season` varchar(100) CHARACTER SET utf8mb4 NULL,
    `RefType` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `Reference` varchar(100) CHARACTER SET utf8mb4 NULL,
    `OriginalAmount` decimal(18,2) NOT NULL,
    `OutstandingAmount` decimal(18,2) NOT NULL,
    `Amount` decimal(18,2) NOT NULL,
    `Discount` decimal(18,2) NOT NULL,
    `OtherCharges` decimal(18,2) NOT NULL,
    `FinalAmount` decimal(18,2) NOT NULL,
    `PaymentMode` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `BankAccountId` int NULL,
    `BankAccount` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `TransactionRef` varchar(100) CHARACTER SET utf8mb4 NULL,
    `ChequeNo` varchar(100) CHARACTER SET utf8mb4 NULL,
    `ChequeDate` datetime(6) NULL,
    `BuyerId` int NULL,
    `SaleId` int NULL,
    `Remarks` varchar(500) CHARACTER SET utf8mb4 NULL,
    `Status` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `CancellationReason` varchar(300) CHARACTER SET utf8mb4 NULL,
    `CancelledAt` datetime(6) NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NULL,
    CONSTRAINT `PK_finance_receipts` PRIMARY KEY (`Id`),
    KEY `IX_finance_receipts_Date` (`Date`),
    KEY `IX_finance_receipts_PaymentMode` (`PaymentMode`),
    UNIQUE KEY `IX_finance_receipts_ReceiptNo` (`ReceiptNo`),
    KEY `IX_finance_receipts_Status` (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `income_categories` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Code` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Source` longtext CHARACTER SET utf8mb4 NULL,
    `Description` varchar(250) CHARACTER SET utf8mb4 NULL,
    `IsActive` tinyint(1) NOT NULL DEFAULT TRUE,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_income_categories` PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `irrigation_sources` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Description` varchar(250) CHARACTER SET utf8mb4 NULL,
    `IsActive` tinyint(1) NOT NULL,
    CONSTRAINT `PK_irrigation_sources` PRIMARY KEY (`Id`),
    UNIQUE KEY `IX_irrigation_sources_Name` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `labour_attendance` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `attendance_code` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `attendance_date` datetime(6) NOT NULL,
    `labour_id` bigint unsigned NOT NULL,
    `farm_name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `crop_name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `work_type` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `work_basis` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `units_worked` decimal(65,30) NOT NULL,
    `rate` decimal(65,30) NOT NULL,
    `calculated_amount` decimal(65,30) NOT NULL,
    `amount` decimal(65,30) NOT NULL,
    `notes` longtext CHARACTER SET utf8mb4 NULL,
    `created_at` datetime(6) NULL,
    CONSTRAINT `PK_labour_attendance` PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `labour_payments` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `payment_code` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `payment_date` datetime(6) NOT NULL,
    `labour_id` bigint unsigned NOT NULL,
    `amount_paid` decimal(65,30) NOT NULL,
    `payment_mode` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `reference_no` varchar(100) CHARACTER SET utf8mb4 NULL,
    `period_start` datetime(6) NULL,
    `period_end` datetime(6) NULL,
    `notes` longtext CHARACTER SET utf8mb4 NULL,
    `created_at` datetime(6) NULL,
    CONSTRAINT `PK_labour_payments` PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `labour_work_types` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `code` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `work_type_name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `default_rate` decimal(65,30) NOT NULL,
    `unit` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `description` longtext CHARACTER SET utf8mb4 NULL,
    `status` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `created_at` datetime(6) NULL,
    CONSTRAINT `PK_labour_work_types` PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `labours` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `labour_code` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `labour_name` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `mobile` varchar(15) CHARACTER SET utf8mb4 NOT NULL,
    `gender` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `village` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `daily_rate` decimal(65,30) NOT NULL,
    `status` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `photo` longtext CHARACTER SET utf8mb4 NULL,
    `notes` longtext CHARACTER SET utf8mb4 NULL,
    `created_at` datetime(6) NULL,
    `updated_at` datetime(6) NULL,
    CONSTRAINT `PK_labours` PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `loans` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `LoanNo` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `LoanAccountNo` varchar(100) CHARACTER SET utf8mb4 NULL,
    `BankLender` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `LoanType` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `LoanPurpose` varchar(500) CHARACTER SET utf8mb4 NULL,
    `SanctionAmount` decimal(18,2) NOT NULL,
    `DisbursedAmount` decimal(18,2) NOT NULL,
    `OutstandingPrincipal` decimal(18,2) NOT NULL,
    `InterestRate` decimal(5,2) NOT NULL,
    `InterestType` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `TenureMonths` int NOT NULL,
    `RepaymentFrequency` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `EmiAmount` decimal(18,2) NOT NULL,
    `StartDate` datetime(6) NOT NULL,
    `EndDate` datetime(6) NOT NULL,
    `NextEmiDueDate` datetime(6) NULL,
    `ProcessingFees` decimal(18,2) NOT NULL,
    `Status` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `Remarks` varchar(500) CHARACTER SET utf8mb4 NULL,
    `ClosedDate` datetime(6) NULL,
    `ClosureCertificateUrl` varchar(500) CHARACTER SET utf8mb4 NULL,
    `ClosureRemarks` varchar(500) CHARACTER SET utf8mb4 NULL,
    `FarmerId` int NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NULL,
    CONSTRAINT `PK_loans` PRIMARY KEY (`Id`),
    KEY `IX_loans_BankLender` (`BankLender`),
    UNIQUE KEY `IX_loans_LoanNo` (`LoanNo`),
    KEY `IX_loans_Status` (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_categories` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Description` varchar(250) CHARACTER SET utf8mb4 NULL,
    `IsActive` tinyint(1) NOT NULL DEFAULT TRUE,
    CONSTRAINT `PK_product_categories` PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `soil_types` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Description` varchar(250) CHARACTER SET utf8mb4 NULL,
    `IsActive` tinyint(1) NOT NULL,
    CONSTRAINT `PK_soil_types` PRIMARY KEY (`Id`),
    UNIQUE KEY `IX_soil_types_Name` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `units` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Name` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `ShortCode` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `IsActive` tinyint(1) NOT NULL DEFAULT TRUE,
    CONSTRAINT `PK_units` PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crops` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `CategoryId` int NULL,
    `CropCode` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `CropName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `CropType` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `DefaultUnit` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `DurationDays` int NULL,
    `Status` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_crops` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_crops_crop_categories_CategoryId` FOREIGN KEY (`CategoryId`) REFERENCES `crop_categories` (`Id`),
    KEY `IX_crops_CategoryId` (`CategoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `farmer_addresses` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `FarmerId` int NOT NULL,
    `Address` varchar(250) CHARACTER SET utf8mb4 NULL,
    `Village` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Mandal` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `District` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `State` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `PinCode` varchar(10) CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_farmer_addresses` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_farmer_addresses_farmers_FarmerId` FOREIGN KEY (`FarmerId`) REFERENCES `farmers` (`Id`) ON DELETE CASCADE,
    UNIQUE KEY `IX_farmer_addresses_FarmerId` (`FarmerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `farmer_bank_accounts` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `FarmerId` int NOT NULL,
    `BankName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `AccountNumber` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `IFSC` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_farmer_bank_accounts` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_farmer_bank_accounts_farmers_FarmerId` FOREIGN KEY (`FarmerId`) REFERENCES `farmers` (`Id`) ON DELETE CASCADE,
    UNIQUE KEY `IX_farmer_bank_accounts_FarmerId` (`FarmerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `farms` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `FarmerId` int NOT NULL,
    `FarmName` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `OwnershipType` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `Village` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Mandal` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `District` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `State` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Pincode` varchar(10) CHARACTER SET utf8mb4 NULL,
    `Status` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Active',
    `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` datetime(6) NULL,
    CONSTRAINT `PK_farms` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_farms_farmers_FarmerId` FOREIGN KEY (`FarmerId`) REFERENCES `farmers` (`Id`) ON DELETE RESTRICT,
    KEY `IX_farms_FarmerId` (`FarmerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `suppliers` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `FarmerId` int NOT NULL,
    `Name` varchar(150) CHARACTER SET utf8mb4 NULL,
    `ContactPerson` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Phone` varchar(20) CHARACTER SET utf8mb4 NULL,
    `email` varchar(120) CHARACTER SET utf8mb4 NULL,
    `address` longtext CHARACTER SET utf8mb4 NOT NULL,
    `GstNumber` varchar(50) CHARACTER SET utf8mb4 NULL,
    `supplier_code` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `supplier_name` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `supplier_type` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `mobile` varchar(15) CHARACTER SET utf8mb4 NOT NULL,
    `city` varchar(100) CHARACTER SET utf8mb4 NULL,
    `district` varchar(100) CHARACTER SET utf8mb4 NULL,
    `state` varchar(100) CHARACTER SET utf8mb4 NULL,
    `pin_code` varchar(10) CHARACTER SET utf8mb4 NULL,
    `gstin` varchar(20) CHARACTER SET utf8mb4 NULL,
    `bank_name` varchar(120) CHARACTER SET utf8mb4 NULL,
    `account_number` varchar(50) CHARACTER SET utf8mb4 NULL,
    `ifsc_code` varchar(20) CHARACTER SET utf8mb4 NULL,
    `branch_name` varchar(100) CHARACTER SET utf8mb4 NULL,
    `opening_balance` decimal(12,2) NOT NULL DEFAULT 0.0,
    `status` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Active',
    `notes` longtext CHARACTER SET utf8mb4 NULL,
    `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `PK_suppliers` PRIMARY KEY (`id`),
    CONSTRAINT `FK_suppliers_farmers_FarmerId` FOREIGN KEY (`FarmerId`) REFERENCES `farmers` (`Id`) ON DELETE RESTRICT,
    KEY `IX_suppliers_FarmerId` (`FarmerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `income_transactions` (
    `Id` bigint NOT NULL AUTO_INCREMENT,
    `IncomeNo` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `IncomeDate` datetime(6) NOT NULL,
    `CategoryId` int NOT NULL,
    `FarmerId` int NULL,
    `Farm` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `Crop` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Buyer` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `GrossAmount` decimal(18,2) NOT NULL,
    `Discount` decimal(18,2) NOT NULL DEFAULT 0.0,
    `OtherCharges` decimal(18,2) NOT NULL DEFAULT 0.0,
    `NetAmount` decimal(18,2) NOT NULL,
    `Status` varchar(30) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Completed',
    `Remarks` varchar(500) CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `PK_income_transactions` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_income_transactions_farmers_FarmerId` FOREIGN KEY (`FarmerId`) REFERENCES `farmers` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_income_transactions_income_categories_CategoryId` FOREIGN KEY (`CategoryId`) REFERENCES `income_categories` (`Id`) ON DELETE RESTRICT,
    KEY `IX_income_transactions_CategoryId` (`CategoryId`),
    KEY `IX_income_transactions_FarmerId` (`FarmerId`),
    UNIQUE KEY `IX_income_transactions_IncomeNo` (`IncomeNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `loan_disbursements` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `LoanId` int NOT NULL,
    `DisbursementNo` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `DisbursementDate` datetime(6) NOT NULL,
    `DisbursedAmount` decimal(18,2) NOT NULL,
    `BankAccount` varchar(150) CHARACTER SET utf8mb4 NULL,
    `ReferenceNo` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Remarks` varchar(500) CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_loan_disbursements` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_loan_disbursements_loans_LoanId` FOREIGN KEY (`LoanId`) REFERENCES `loans` (`Id`) ON DELETE CASCADE,
    UNIQUE KEY `IX_loan_disbursements_DisbursementNo` (`DisbursementNo`),
    KEY `IX_loan_disbursements_LoanId` (`LoanId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `loan_documents` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `LoanId` int NOT NULL,
    `DocumentName` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `DocumentType` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `FileUrl` varchar(500) CHARACTER SET utf8mb4 NOT NULL,
    `UploadedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_loan_documents` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_loan_documents_loans_LoanId` FOREIGN KEY (`LoanId`) REFERENCES `loans` (`Id`) ON DELETE CASCADE,
    KEY `IX_loan_documents_LoanId` (`LoanId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `loan_installments` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `LoanId` int NOT NULL,
    `InstallmentNumber` int NOT NULL,
    `DueDate` datetime(6) NOT NULL,
    `OpeningPrincipal` decimal(18,2) NOT NULL,
    `PrincipalAmount` decimal(18,2) NOT NULL,
    `InterestAmount` decimal(18,2) NOT NULL,
    `EmiAmount` decimal(18,2) NOT NULL,
    `PaidAmount` decimal(18,2) NOT NULL,
    `RemainingAmount` decimal(18,2) NOT NULL,
    `ClosingPrincipal` decimal(18,2) NOT NULL,
    `Status` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `PaidDate` datetime(6) NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_loan_installments` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_loan_installments_loans_LoanId` FOREIGN KEY (`LoanId`) REFERENCES `loans` (`Id`) ON DELETE CASCADE,
    KEY `IX_loan_installments_DueDate` (`DueDate`),
    KEY `IX_loan_installments_LoanId_InstallmentNumber` (`LoanId`, `InstallmentNumber`),
    KEY `IX_loan_installments_Status` (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `loan_payments` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `LoanId` int NOT NULL,
    `VoucherNo` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `PaymentDate` datetime(6) NOT NULL,
    `InstallmentNumber` int NULL,
    `Principal` decimal(18,2) NOT NULL,
    `Interest` decimal(18,2) NOT NULL,
    `Penalty` decimal(18,2) NOT NULL,
    `TotalPayment` decimal(18,2) NOT NULL,
    `PaymentMode` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `ReferenceNo` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Remarks` varchar(500) CHARACTER SET utf8mb4 NULL,
    `PaymentType` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_loan_payments` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_loan_payments_loans_LoanId` FOREIGN KEY (`LoanId`) REFERENCES `loans` (`Id`) ON DELETE RESTRICT,
    KEY `IX_loan_payments_LoanId` (`LoanId`),
    KEY `IX_loan_payments_PaymentDate` (`PaymentDate`),
    UNIQUE KEY `IX_loan_payments_VoucherNo` (`VoucherNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Code` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `Name` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `CategoryId` int NOT NULL,
    `UnitId` int NOT NULL,
    `ReorderLevel` decimal(18,2) NOT NULL DEFAULT 0.0,
    `StandardCost` decimal(18,2) NOT NULL DEFAULT 0.0,
    `IsActive` tinyint(1) NOT NULL DEFAULT TRUE,
    CONSTRAINT `PK_products` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_products_product_categories_CategoryId` FOREIGN KEY (`CategoryId`) REFERENCES `product_categories` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_products_units_UnitId` FOREIGN KEY (`UnitId`) REFERENCES `units` (`Id`) ON DELETE RESTRICT,
    KEY `IX_products_CategoryId` (`CategoryId`),
    UNIQUE KEY `IX_products_Code` (`Code`),
    KEY `IX_products_UnitId` (`UnitId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crop_varieties` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Code` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `CropId` int NULL,
    `CropName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `VarietyName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `DurationDays` int NOT NULL,
    `Season` longtext CHARACTER SET utf8mb4 NOT NULL,
    `ExpectedYield` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_crop_varieties` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_crop_varieties_crops_CropId` FOREIGN KEY (`CropId`) REFERENCES `crops` (`Id`),
    KEY `IX_crop_varieties_Code` (`Code`),
    KEY `IX_crop_varieties_CropId` (`CropId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crop_activities` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `ActivityCode` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `FarmId` int NULL,
    `Farm` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CropId` int NULL,
    `Crop` longtext CHARACTER SET utf8mb4 NOT NULL,
    `SeasonId` int NULL,
    `Season` longtext CHARACTER SET utf8mb4 NOT NULL,
    `ActivityType` longtext CHARACTER SET utf8mb4 NOT NULL,
    `ActivityDate` datetime(6) NOT NULL,
    `LabourWorkers` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Machinery` longtext CHARACTER SET utf8mb4 NOT NULL,
    `MaterialsUsed` longtext CHARACTER SET utf8mb4 NOT NULL,
    `TotalCost` decimal(65,30) NOT NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Supervisor` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Notes` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_crop_activities` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_crop_activities_crops_CropId` FOREIGN KEY (`CropId`) REFERENCES `crops` (`Id`),
    CONSTRAINT `FK_crop_activities_farms_FarmId` FOREIGN KEY (`FarmId`) REFERENCES `farms` (`Id`),
    KEY `IX_crop_activities_ActivityCode` (`ActivityCode`),
    KEY `IX_crop_activities_CropId` (`CropId`),
    KEY `IX_crop_activities_FarmId` (`FarmId`),
    KEY `IX_crop_activities_SeasonId` (`SeasonId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crop_seasons` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `FarmId` int NOT NULL,
    `CropId` int NOT NULL,
    `SeasonName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `SowingDate` datetime(6) NOT NULL,
    `ExpectedHarvestDate` datetime(6) NULL,
    `ActualHarvestDate` datetime(6) NULL,
    `AreaAcres` decimal(65,30) NOT NULL,
    `ExpectedYield` decimal(65,30) NULL,
    `ExpectedRevenue` decimal(65,30) NULL,
    `ActualYield` decimal(65,30) NULL,
    `ActualRevenue` decimal(65,30) NULL,
    `Status` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_crop_seasons` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_crop_seasons_crops_CropId` FOREIGN KEY (`CropId`) REFERENCES `crops` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_crop_seasons_farms_FarmId` FOREIGN KEY (`FarmId`) REFERENCES `farms` (`Id`) ON DELETE CASCADE,
    KEY `IX_crop_seasons_CropId` (`CropId`),
    KEY `IX_crop_seasons_FarmId` (`FarmId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `farm_documents` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `FarmId` int NOT NULL,
    `DocumentType` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `DocumentNumber` varchar(100) CHARACTER SET utf8mb4 NULL,
    `FileName` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `FileUrl` varchar(500) CHARACTER SET utf8mb4 NULL,
    `FileSize` bigint NULL,
    `UploadedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `PK_farm_documents` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_farm_documents_farms_FarmId` FOREIGN KEY (`FarmId`) REFERENCES `farms` (`Id`) ON DELETE CASCADE,
    KEY `IX_farm_documents_FarmId` (`FarmId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `farm_land_details` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `FarmId` int NOT NULL,
    `SurveyNumber` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `LandArea` decimal(18,2) NOT NULL,
    `AreaUnit` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `LandType` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `IrrigationSourceId` int NULL,
    `SoilTypeId` int NULL,
    `BoundariesNorth` varchar(200) CHARACTER SET utf8mb4 NULL,
    `BoundariesSouth` varchar(200) CHARACTER SET utf8mb4 NULL,
    `BoundariesEast` varchar(200) CHARACTER SET utf8mb4 NULL,
    `BoundariesWest` varchar(200) CHARACTER SET utf8mb4 NULL,
    `Remarks` varchar(500) CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` datetime(6) NULL,
    CONSTRAINT `PK_farm_land_details` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_farm_land_details_farms_FarmId` FOREIGN KEY (`FarmId`) REFERENCES `farms` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_farm_land_details_irrigation_sources_IrrigationSourceId` FOREIGN KEY (`IrrigationSourceId`) REFERENCES `irrigation_sources` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_farm_land_details_soil_types_SoilTypeId` FOREIGN KEY (`SoilTypeId`) REFERENCES `soil_types` (`Id`) ON DELETE SET NULL,
    KEY `IX_farm_land_details_FarmId` (`FarmId`),
    KEY `IX_farm_land_details_IrrigationSourceId` (`IrrigationSourceId`),
    KEY `IX_farm_land_details_SoilTypeId` (`SoilTypeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `purchases` (
    `Id` bigint NOT NULL AUTO_INCREMENT,
    `PurchaseNo` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `PurchaseDate` datetime(6) NOT NULL,
    `FarmerId` int NOT NULL,
    `SupplierId` bigint NOT NULL,
    `FarmId` bigint NULL,
    `CropId` bigint NULL,
    `SubTotal` decimal(18,2) NOT NULL DEFAULT 0.0,
    `DiscountAmount` decimal(18,2) NOT NULL DEFAULT 0.0,
    `TaxAmount` decimal(18,2) NOT NULL DEFAULT 0.0,
    `TotalAmount` decimal(18,2) NOT NULL DEFAULT 0.0,
    `PaidAmount` decimal(18,2) NOT NULL DEFAULT 0.0,
    `BalanceAmount` decimal(18,2) NOT NULL DEFAULT 0.0,
    `PaymentStatus` varchar(30) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Pending',
    `Notes` varchar(500) CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_purchases` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_purchases_farmers_FarmerId` FOREIGN KEY (`FarmerId`) REFERENCES `farmers` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_purchases_suppliers_SupplierId` FOREIGN KEY (`SupplierId`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT,
    KEY `IX_purchases_FarmerId` (`FarmerId`),
    UNIQUE KEY `IX_purchases_PurchaseNo` (`PurchaseNo`),
    KEY `IX_purchases_SupplierId` (`SupplierId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `supplier_payments` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `payment_code` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `payment_date` datetime(6) NOT NULL,
    `supplier_id` bigint NOT NULL,
    `supplier_name` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `amount_paid` decimal(12,2) NOT NULL,
    `payment_mode` varchar(50) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Bank Transfer',
    `reference_no` varchar(100) CHARACTER SET utf8mb4 NULL,
    `bank_account` varchar(120) CHARACTER SET utf8mb4 NULL,
    `notes` longtext CHARACTER SET utf8mb4 NULL,
    `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `PK_supplier_payments` PRIMARY KEY (`id`),
    CONSTRAINT `FK_supplier_payments_suppliers_supplier_id` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE,
    KEY `IX_supplier_payments_supplier_id` (`supplier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `supplier_transactions` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `transaction_code` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `transaction_date` datetime(6) NOT NULL,
    `supplier_id` bigint NOT NULL,
    `supplier_name` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `transaction_type` varchar(50) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Purchase',
    `reference_no` varchar(100) CHARACTER SET utf8mb4 NULL,
    `category` varchar(100) CHARACTER SET utf8mb4 NULL,
    `items_summary` longtext CHARACTER SET utf8mb4 NULL,
    `amount` decimal(12,2) NOT NULL DEFAULT 0.0,
    `paid_amount` decimal(12,2) NOT NULL DEFAULT 0.0,
    `balance_amount` decimal(12,2) NOT NULL DEFAULT 0.0,
    `payment_status` varchar(50) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Pending',
    `notes` longtext CHARACTER SET utf8mb4 NULL,
    `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `PK_supplier_transactions` PRIMARY KEY (`id`),
    CONSTRAINT `FK_supplier_transactions_suppliers_supplier_id` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE,
    KEY `IX_supplier_transactions_supplier_id` (`supplier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `income_payments` (
    `Id` bigint NOT NULL AUTO_INCREMENT,
    `TransactionId` bigint NOT NULL,
    `Amount` decimal(18,2) NOT NULL,
    `PaymentMode` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `BankOrCash` varchar(100) CHARACTER SET utf8mb4 NULL,
    `ReferenceNumber` varchar(100) CHARACTER SET utf8mb4 NULL,
    `PaymentDate` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `PK_income_payments` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_income_payments_income_transactions_TransactionId` FOREIGN KEY (`TransactionId`) REFERENCES `income_transactions` (`Id`) ON DELETE CASCADE,
    KEY `IX_income_payments_TransactionId` (`TransactionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `income_transaction_items` (
    `Id` bigint NOT NULL AUTO_INCREMENT,
    `TransactionId` bigint NOT NULL,
    `ItemName` varchar(150) CHARACTER SET utf8mb4 NULL,
    `Quantity` decimal(18,2) NOT NULL,
    `Unit` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `Rate` decimal(18,2) NOT NULL,
    `TotalAmount` decimal(18,2) NOT NULL,
    CONSTRAINT `PK_income_transaction_items` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_income_transaction_items_income_transactions_TransactionId` FOREIGN KEY (`TransactionId`) REFERENCES `income_transactions` (`Id`) ON DELETE CASCADE,
    KEY `IX_income_transaction_items_TransactionId` (`TransactionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `ProductId` int NOT NULL,
    `StorageLocation` varchar(100) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Main Warehouse',
    `CurrentStock` decimal(18,2) NOT NULL DEFAULT 0.0,
    `ReservedStock` decimal(18,2) NOT NULL DEFAULT 0.0,
    `LastUpdated` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `PK_inventory` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_inventory_products_ProductId` FOREIGN KEY (`ProductId`) REFERENCES `products` (`Id`) ON DELETE CASCADE,
    UNIQUE KEY `IX_inventory_ProductId_StorageLocation` (`ProductId`, `StorageLocation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_transactions` (
    `Id` bigint NOT NULL AUTO_INCREMENT,
    `TransactionDate` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `ProductId` int NOT NULL,
    `TransactionType` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `Quantity` decimal(18,2) NOT NULL,
    `UnitPrice` decimal(18,2) NOT NULL DEFAULT 0.0,
    `StorageLocation` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `ReferenceType` varchar(50) CHARACTER SET utf8mb4 NULL,
    `ReferenceNumber` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Notes` varchar(500) CHARACTER SET utf8mb4 NULL,
    `BalanceAfterTransaction` decimal(18,2) NOT NULL,
    CONSTRAINT `PK_inventory_transactions` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_inventory_transactions_products_ProductId` FOREIGN KEY (`ProductId`) REFERENCES `products` (`Id`) ON DELETE RESTRICT,
    KEY `IX_inventory_transactions_ProductId` (`ProductId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stock_adjustments` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `AdjustmentNumber` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `AdjustmentDate` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `ProductId` int NOT NULL,
    `StorageLocation` varchar(100) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Main Warehouse',
    `BookStock` decimal(18,2) NOT NULL,
    `PhysicalStock` decimal(18,2) NOT NULL,
    `Reason` varchar(250) CHARACTER SET utf8mb4 NOT NULL,
    `Remarks` varchar(500) CHARACTER SET utf8mb4 NULL,
    `AdjustmentType` varchar(50) CHARACTER SET utf8mb4 NULL,
    `ApprovedBy` varchar(100) CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_stock_adjustments` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_stock_adjustments_products_ProductId` FOREIGN KEY (`ProductId`) REFERENCES `products` (`Id`) ON DELETE RESTRICT,
    UNIQUE KEY `IX_stock_adjustments_AdjustmentNumber` (`AdjustmentNumber`),
    KEY `IX_stock_adjustments_ProductId` (`ProductId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `purchase_items` (
    `Id` bigint NOT NULL AUTO_INCREMENT,
    `PurchaseId` bigint NOT NULL,
    `ProductName` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `Unit` varchar(30) CHARACTER SET utf8mb4 NULL,
    `Quantity` decimal(18,2) NOT NULL,
    `Rate` decimal(18,2) NOT NULL,
    `Discount` decimal(18,2) NOT NULL DEFAULT 0.0,
    `TaxRate` decimal(18,2) NOT NULL DEFAULT 0.0,
    `Total` decimal(18,2) NOT NULL,
    CONSTRAINT `PK_purchase_items` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_purchase_items_purchases_PurchaseId` FOREIGN KEY (`PurchaseId`) REFERENCES `purchases` (`Id`) ON DELETE CASCADE,
    KEY `IX_purchase_items_PurchaseId` (`PurchaseId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `purchase_payments` (
    `Id` bigint NOT NULL AUTO_INCREMENT,
    `PurchaseId` bigint NOT NULL,
    `PaymentDate` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `Amount` decimal(18,2) NOT NULL,
    `PaymentMode` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `BankOrCash` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `ReferenceNumber` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Notes` varchar(500) CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_purchase_payments` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_purchase_payments_purchases_PurchaseId` FOREIGN KEY (`PurchaseId`) REFERENCES `purchases` (`Id`) ON DELETE CASCADE,
    KEY `IX_purchase_payments_PurchaseId` (`PurchaseId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `income_categories` (`Id`, `Code`, `CreatedAt`, `Description`, `IsActive`, `Name`, `Source`, `Status`)
VALUES (1, 'INC-CAT-1', TIMESTAMP '2026-01-01 00:00:00', NULL, TRUE, 'Crop Sales', NULL, 'Active'),
(2, 'INC-CAT-2', TIMESTAMP '2026-01-01 00:00:00', NULL, TRUE, 'Milk Sales', NULL, 'Active'),
(3, 'INC-CAT-3', TIMESTAMP '2026-01-01 00:00:00', NULL, TRUE, 'Animal Sales', NULL, 'Active'),
(4, 'INC-CAT-4', TIMESTAMP '2026-01-01 00:00:00', NULL, TRUE, 'Government Subsidy', NULL, 'Active'),
(5, 'INC-CAT-5', TIMESTAMP '2026-01-01 00:00:00', NULL, TRUE, 'Loan Received', NULL, 'Active'),
(6, 'INC-CAT-6', TIMESTAMP '2026-01-01 00:00:00', NULL, TRUE, 'Rental Income', NULL, 'Active'),
(7, 'INC-CAT-7', TIMESTAMP '2026-01-01 00:00:00', NULL, TRUE, 'Other Income', NULL, 'Active');

INSERT IGNORE INTO `irrigation_sources` (`Id`, `Description`, `IsActive`, `Name`)
VALUES (1, 'Groundwater deep borewell extraction', TRUE, 'Borewell'),
(2, 'Government canal gravity irrigation', TRUE, 'Canal'),
(3, 'Precision drip micro-irrigation system', TRUE, 'Drip'),
(4, 'Monsoon seasonal rain-fed cultivation', TRUE, 'Rain-fed'),
(5, 'Overhead sprinkler distribution', TRUE, 'Sprinkler'),
(6, 'Lift irrigation from perennial river', TRUE, 'River Lift');

INSERT IGNORE INTO `product_categories` (`Id`, `Description`, `IsActive`, `Name`)
VALUES (1, 'Agricultural seeds and saplings', TRUE, 'Seeds'),
(2, 'Organic and chemical fertilizers', TRUE, 'Fertilizers'),
(3, 'Insecticides, fungicides, and weedicides', TRUE, 'Pesticides'),
(4, 'Special spray formulations and micronutrients', TRUE, 'Sprayer chemicals'),
(5, 'Tractor, motor, and farm machinery spares', TRUE, 'Spare parts'),
(6, 'Pipes, ropes, tarpaulins, and farm tools', TRUE, 'Other consumables');

INSERT IGNORE INTO `soil_types` (`Id`, `Description`, `IsActive`, `Name`)
VALUES (1, 'High clay content cotton soil', TRUE, 'Black Soil'),
(2, 'Iron-rich porous agricultural soil', TRUE, 'Red Soil'),
(3, 'River basin highly fertile silt soil', TRUE, 'Alluvial Soil'),
(4, 'Balanced moisture-retaining loam', TRUE, 'Clay Loam'),
(5, 'Fast-draining sandy loam soil', TRUE, 'Sandy Loam'),
(6, 'Acidic high rainfall region soil', TRUE, 'Laterite Soil');

INSERT IGNORE INTO `units` (`Id`, `IsActive`, `Name`, `ShortCode`)
VALUES (1, TRUE, 'Kilograms', 'kg'),
(2, TRUE, 'Grams', 'g'),
(3, TRUE, 'Litres', 'L'),
(4, TRUE, 'Millilitres', 'ml'),
(5, TRUE, 'Bags', 'bag'),
(6, TRUE, 'Packets', 'pkt'),
(7, TRUE, 'Bottles', 'btl'),
(8, TRUE, 'Pieces / Numbers', 'nos');
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `purchase_payments`;
DROP TABLE IF EXISTS `purchase_items`;
DROP TABLE IF EXISTS `stock_adjustments`;
DROP TABLE IF EXISTS `inventory_transactions`;
DROP TABLE IF EXISTS `inventory`;
DROP TABLE IF EXISTS `income_transaction_items`;
DROP TABLE IF EXISTS `income_payments`;
DROP TABLE IF EXISTS `supplier_transactions`;
DROP TABLE IF EXISTS `supplier_payments`;
DROP TABLE IF EXISTS `purchases`;
DROP TABLE IF EXISTS `farm_land_details`;
DROP TABLE IF EXISTS `farm_documents`;
DROP TABLE IF EXISTS `crop_seasons`;
DROP TABLE IF EXISTS `crop_activities`;
DROP TABLE IF EXISTS `crop_varieties`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `loan_payments`;
DROP TABLE IF EXISTS `loan_installments`;
DROP TABLE IF EXISTS `loan_documents`;
DROP TABLE IF EXISTS `loan_disbursements`;
DROP TABLE IF EXISTS `income_transactions`;
DROP TABLE IF EXISTS `suppliers`;
DROP TABLE IF EXISTS `farms`;
DROP TABLE IF EXISTS `farmer_bank_accounts`;
DROP TABLE IF EXISTS `farmer_addresses`;
DROP TABLE IF EXISTS `crops`;
DROP TABLE IF EXISTS `units`;
DROP TABLE IF EXISTS `soil_types`;
DROP TABLE IF EXISTS `product_categories`;
DROP TABLE IF EXISTS `loans`;
DROP TABLE IF EXISTS `labours`;
DROP TABLE IF EXISTS `labour_work_types`;
DROP TABLE IF EXISTS `labour_payments`;
DROP TABLE IF EXISTS `labour_attendance`;
DROP TABLE IF EXISTS `irrigation_sources`;
DROP TABLE IF EXISTS `income_categories`;
DROP TABLE IF EXISTS `finance_receipts`;
DROP TABLE IF EXISTS `finance_payments`;
DROP TABLE IF EXISTS `farmers`;
DROP TABLE IF EXISTS `crop_categories`;
DROP TABLE IF EXISTS `bank_accounts`;
SET FOREIGN_KEY_CHECKS = 1;
");
        }
    }
}
