-- ==========================================================
-- AGRIMAN - Farm Financial Management System
-- Database Schema for Labour Management & Farm Operations
-- Compatible with MySQL 5.7+ / 8.0+ / MariaDB
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `agriman_farm_db`
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `agriman_farm_db`;

-- ----------------------------------------------------------
-- 1. Labour Master Table (Labour Directory)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `labours` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `labour_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique Labour Code (e.g., LBR-001)',
    `labour_name` VARCHAR(150) NOT NULL COMMENT 'Full Name of the Labourer',
    `mobile` VARCHAR(15) NOT NULL COMMENT 'Contact Mobile Number',
    `gender` ENUM('Male', 'Female', 'Other') NOT NULL DEFAULT 'Male' COMMENT 'Gender',
    `village` VARCHAR(100) NOT NULL COMMENT 'Village / Native place',
    `daily_rate` DECIMAL(10, 2) NOT NULL DEFAULT 400.00 COMMENT 'Standard Daily Wage Rate (INR)',
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active' COMMENT 'Labour Status',
    `photo` LONGTEXT DEFAULT NULL COMMENT 'Labourer photo (Base64 data URI or image URL)',
    `notes` TEXT DEFAULT NULL COMMENT 'Optional skills or remarks',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_labour_code` (`labour_code`),
    INDEX `idx_labour_mobile` (`mobile`),
    INDEX `idx_labour_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 2. Labour Work Types Master Table
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `labour_work_types` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Work Type Code (e.g., LWT-001)',
    `work_type_name` VARCHAR(100) NOT NULL COMMENT 'Work Type Description',
    `default_rate` DECIMAL(10, 2) NOT NULL DEFAULT 450.00 COMMENT 'Default Daily or Unit Rate (INR)',
    `unit` VARCHAR(20) NOT NULL DEFAULT 'Day' COMMENT 'Unit of Work (Day, Hour, Acre, Bag)',
    `description` TEXT DEFAULT NULL COMMENT 'Details of agricultural operations',
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active' COMMENT 'Status',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_work_type_name` (`work_type_name`),
    INDEX `idx_work_type_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 3. Labour Attendance Table
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `labour_attendance` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `attendance_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Attendance Code (e.g., ATT-001)',
    `attendance_date` DATE NOT NULL COMMENT 'Date of Work',
    `labour_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign Key referencing labours.id',
    `farm_name` VARCHAR(100) NOT NULL COMMENT 'Farm location or block',
    `crop_name` VARCHAR(100) NOT NULL COMMENT 'Crop cultivated',
    `work_type` VARCHAR(100) NOT NULL COMMENT 'Work type performed',
    `work_basis` ENUM('Days', 'Hours') NOT NULL DEFAULT 'Days' COMMENT 'Days or Hours worked',
    `units_worked` DECIMAL(6, 2) NOT NULL DEFAULT 1.00 COMMENT 'Number of days (e.g. 1.0, 0.5) or hours',
    `rate` DECIMAL(10, 2) NOT NULL COMMENT 'Applicable wage rate per unit',
    `calculated_amount` DECIMAL(10, 2) NOT NULL COMMENT 'Calculated Amount (units_worked * rate)',
    `amount` DECIMAL(10, 2) NOT NULL COMMENT 'Payable amount (allows authorized adjustment)',
    `notes` TEXT DEFAULT NULL COMMENT 'Field or performance notes',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_labour_attendance_labour`
        FOREIGN KEY (`labour_id`) REFERENCES `labours` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_attendance_date` (`attendance_date`),
    INDEX `idx_attendance_labour` (`labour_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 4. Labour Payments Table
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `labour_payments` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `payment_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Payment Voucher Code (e.g., LPY-001)',
    `payment_date` DATE NOT NULL COMMENT 'Payment Date',
    `labour_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign Key referencing labours.id',
    `amount_paid` DECIMAL(10, 2) NOT NULL COMMENT 'Amount paid to the labourer (INR)',
    `payment_mode` ENUM('Cash', 'Bank Transfer', 'UPI', 'Cheque') NOT NULL DEFAULT 'Cash' COMMENT 'Payment method',
    `reference_no` VARCHAR(100) DEFAULT NULL COMMENT 'Transaction reference or cheque number',
    `period_start` DATE DEFAULT NULL COMMENT 'Start of wage settlement period',
    `period_end` DATE DEFAULT NULL COMMENT 'End of wage settlement period',
    `notes` TEXT DEFAULT NULL COMMENT 'Payment remarks or supervisor note',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_labour_payments_labour`
        FOREIGN KEY (`labour_id`) REFERENCES `labours` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_payment_date` (`payment_date`),
    INDEX `idx_payment_labour` (`labour_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Sample Data Insertion for Labour Management Module
-- ----------------------------------------------------------
INSERT INTO `labour_work_types` (`code`, `work_type_name`, `default_rate`, `unit`, `description`, `status`)
VALUES
('LWT-001', 'Land Preparation', 500.00, 'Day', 'Ploughing, tilling, levelling, and bed forming', 'Active'),
('LWT-002', 'Planting', 450.00, 'Day', 'Seed sowing, nursery transplantation, and dibbling', 'Active'),
('LWT-003', 'Weeding', 400.00, 'Day', 'Manual inter-cultivation and unwanted weed removal', 'Active'),
('LWT-004', 'Spraying', 550.00, 'Day', 'Foliar nutrition, biological and pesticide application', 'Active'),
('LWT-005', 'Harvesting', 500.00, 'Day', 'Crop cutting, picking, sorting, and field gathering', 'Active'),
('LWT-006', 'Loading', 450.00, 'Day', 'Loading farm produce and harvested sacks onto tractor/trucks', 'Active'),
('LWT-007', 'Unloading', 450.00, 'Day', 'Unloading fertilizer bags, seed trays, or inputs', 'Active');

INSERT INTO `labours` (`labour_code`, `labour_name`, `mobile`, `gender`, `village`, `daily_rate`, `status`, `notes`)
VALUES
('LBR-001', 'Mallaiah Goud', '9849123401', 'Male', 'Kankipadu', 450.00, 'Active', 'Experienced in tractor driving & land preparation'),
('LBR-002', 'Lakshmi Devi', '9849123402', 'Female', 'Penamaluru', 400.00, 'Active', 'Specialized in nursery transplanting and weeding'),
('LBR-003', 'Venkatesh Naidu', '9849123403', 'Male', 'Tadikonda', 500.00, 'Active', 'Experienced knapsack sprayer and irrigation technician'),
('LBR-004', 'Parvathamma B.', '9849123404', 'Female', 'Kankipadu', 400.00, 'Active', 'Fast picker for chilli and tomato harvests'),
('LBR-005', 'Ravi Shankar', '9849123405', 'Male', 'Atmakur', 480.00, 'Active', 'Loading, unloading, and post-harvest bagging'),
('LBR-006', 'Subba Rao', '9849123406', 'Male', 'Parkal', 450.00, 'Inactive', 'Seasonal worker currently unavailable');

INSERT INTO `labour_attendance` (`attendance_code`, `attendance_date`, `labour_id`, `farm_name`, `crop_name`, `work_type`, `work_basis`, `units_worked`, `rate`, `calculated_amount`, `amount`, `notes`)
VALUES
('ATT-001', '2026-10-25', 1, 'Farm 1', 'Paddy (Rice)', 'Land Preparation', 'Days', 1.00, 500.00, 500.00, 500.00, 'Completed plot ploughing with rotavator'),
('ATT-002', '2026-10-25', 2, 'Farm 1', 'Paddy (Rice)', 'Planting', 'Days', 1.00, 400.00, 400.00, 400.00, 'Transplanted seedling nursery block A'),
('ATT-003', '2026-10-26', 3, 'Farm 2', 'Cotton', 'Spraying', 'Days', 1.00, 550.00, 550.00, 550.00, 'Neem oil biopesticide spray on Cotton block'),
('ATT-004', '2026-10-26', 4, 'Main Field', 'Chilli', 'Weeding', 'Days', 1.00, 400.00, 400.00, 400.00, 'Manual weeding along ridge rows'),
('ATT-005', '2026-10-27', 1, 'Farm 1', 'Tomato', 'Loading', 'Days', 0.50, 450.00, 225.00, 225.00, 'Half-day tomato crates loading onto pickup'),
('ATT-006', '2026-10-28', 5, 'Hillside Plot', 'Sugarcane', 'Harvesting', 'Days', 1.00, 500.00, 500.00, 500.00, 'Cane cutting and bundle stacking');

INSERT INTO `labour_payments` (`payment_code`, `payment_date`, `labour_id`, `amount_paid`, `payment_mode`, `reference_no`, `period_start`, `period_end`, `notes`)
VALUES
('LPY-001', '2026-10-27', 1, 500.00, 'Cash', 'VOUCH-101', '2026-10-25', '2026-10-25', 'Full settlement for land prep work'),
('LPY-002', '2026-10-27', 2, 400.00, 'UPI', 'UPI-99882211', '2026-10-25', '2026-10-25', 'Paid to PhonePe registered number'),
('LPY-003', '2026-10-28', 3, 300.00, 'Cash', 'VOUCH-102', '2026-10-26', '2026-10-26', 'Partial advance paid for spraying work');

-- ----------------------------------------------------------
-- 5. Suppliers Master Table
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `suppliers` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `supplier_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique Supplier Code (e.g., SUP-001)',
    `supplier_name` VARCHAR(150) NOT NULL COMMENT 'Full Legal / Trade Name of Supplier',
    `supplier_type` VARCHAR(100) NOT NULL DEFAULT 'General' COMMENT 'Category / Type of goods supplied',
    `mobile` VARCHAR(15) NOT NULL COMMENT 'Contact Mobile Number',
    `email` VARCHAR(120) DEFAULT NULL COMMENT 'Contact Email Address',
    `address` TEXT NOT NULL COMMENT 'Physical Address / Street / Location',
    `city` VARCHAR(100) DEFAULT NULL COMMENT 'City or Mandal',
    `district` VARCHAR(100) DEFAULT NULL COMMENT 'District',
    `state` VARCHAR(100) DEFAULT NULL COMMENT 'State',
    `pin_code` VARCHAR(10) DEFAULT NULL COMMENT 'Postal PIN Code',
    `gstin` VARCHAR(20) DEFAULT NULL COMMENT 'Goods and Services Tax Identification Number',
    `bank_name` VARCHAR(120) DEFAULT NULL COMMENT 'Bank Name',
    `account_number` VARCHAR(50) DEFAULT NULL COMMENT 'Bank Account Number',
    `ifsc_code` VARCHAR(20) DEFAULT NULL COMMENT 'IFSC Code',
    `branch_name` VARCHAR(100) DEFAULT NULL COMMENT 'Bank Branch Name',
    `opening_balance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Opening Balance (INR)',
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active' COMMENT 'Supplier Status',
    `notes` TEXT DEFAULT NULL COMMENT 'Additional remarks or contact notes',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_supplier_code` (`supplier_code`),
    INDEX `idx_supplier_name` (`supplier_name`),
    INDEX `idx_supplier_mobile` (`mobile`),
    INDEX `idx_supplier_gstin` (`gstin`),
    INDEX `idx_supplier_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 6. Supplier Transactions Table (Purchases & Invoices)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `supplier_transactions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `transaction_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Transaction Code (e.g., STX-001)',
    `transaction_date` DATE NOT NULL COMMENT 'Date of Transaction',
    `supplier_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign Key referencing suppliers.id',
    `supplier_name` VARCHAR(150) NOT NULL COMMENT 'Supplier Name snapshot',
    `transaction_type` ENUM('Purchase', 'Bill', 'Opening Balance', 'Debit Note', 'Credit Note') NOT NULL DEFAULT 'Purchase' COMMENT 'Type of transaction',
    `reference_no` VARCHAR(100) DEFAULT NULL COMMENT 'Invoice or Delivery Challan No.',
    `category` VARCHAR(100) DEFAULT NULL COMMENT 'Item Category (Seeds, Fertilizers, etc.)',
    `items_summary` TEXT DEFAULT NULL COMMENT 'Summary of supplies / items purchased',
    `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Total Transaction / Invoice Amount (INR)',
    `paid_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Amount settled towards this invoice',
    `balance_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Remaining due amount',
    `payment_status` ENUM('Paid', 'Partially Paid', 'Pending', 'Overdue') NOT NULL DEFAULT 'Pending' COMMENT 'Payment Status',
    `notes` TEXT DEFAULT NULL COMMENT 'Transaction remarks',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_supplier_transactions_supplier`
        FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_transaction_date` (`transaction_date`),
    INDEX `idx_transaction_supplier` (`supplier_id`),
    INDEX `idx_transaction_status` (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 7. Supplier Payments Table
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `supplier_payments` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `payment_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Payment Voucher Code (e.g., SPY-001)',
    `payment_date` DATE NOT NULL COMMENT 'Payment Date',
    `supplier_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign Key referencing suppliers.id',
    `supplier_name` VARCHAR(150) NOT NULL COMMENT 'Supplier Name snapshot',
    `amount_paid` DECIMAL(12, 2) NOT NULL COMMENT 'Amount paid to the supplier (INR)',
    `payment_mode` ENUM('Bank Transfer', 'UPI', 'Cheque', 'Cash', 'NEFT/RTGS') NOT NULL DEFAULT 'Bank Transfer' COMMENT 'Payment method',
    `reference_no` VARCHAR(100) DEFAULT NULL COMMENT 'UTR, Transaction reference or cheque number',
    `bank_account` VARCHAR(120) DEFAULT NULL COMMENT 'Source Farm Bank Account used for payment',
    `notes` TEXT DEFAULT NULL COMMENT 'Payment remarks',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_supplier_payments_supplier`
        FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_supplier_payment_date` (`payment_date`),
    INDEX `idx_supplier_payment_supplier` (`supplier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Sample Data Insertion for Supplier Management Module
-- ----------------------------------------------------------
INSERT INTO `suppliers` (`supplier_code`, `supplier_name`, `supplier_type`, `mobile`, `email`, `address`, `city`, `district`, `state`, `pin_code`, `gstin`, `bank_name`, `account_number`, `ifsc_code`, `branch_name`, `opening_balance`, `status`, `notes`)
VALUES
('SUP-001', 'National Seeds Corporation', 'Seeds', '9849123410', 'contact@nationalseeds.gov.in', 'Plot 45, Industrial Estate, Autonagar', 'Vijayawada', 'Krishna', 'Andhra Pradesh', '520007', '37AABCN1234F1Z8', 'State Bank of India', '39876543210', 'SBIN0001234', 'Autonagar Branch', 15000.00, 'Active', 'Government certified foundation and breeder seeds distributor'),
('SUP-002', 'IFFCO Agro Supplies', 'Fertilizers', '9849123411', 'supplies@iffco.in', 'NH-16 Bypass Road, Tadepalli', 'Tadepalli', 'Guntur', 'Andhra Pradesh', '522501', '37AAACI2014K1Z3', 'HDFC Bank', '50200088192341', 'HDFC0000412', 'Tadepalli', 24500.00, 'Active', 'Primary cooperative supplier for chemical fertilizers and urea'),
('SUP-003', 'Coromandel Agro Chemicals', 'Fertilizers', '9849123412', 'orders@coromandel.biz', 'Fertilizer City, Coromandel Gate', 'Visakhapatnam', 'Visakhapatnam', 'Andhra Pradesh', '530014', '37AAACC4451D1ZP', 'ICICI Bank', '004205011982', 'ICIC0000042', 'Vizag Port', 0.00, 'Active', 'Phosphatic fertilizers, complex DAP, and water soluble nutrients'),
('SUP-004', 'Bayer CropScience', 'Pesticides', '9849123413', 'care@bayercropscience.com', 'Bayer House, Central Park, BKC', 'Mumbai', 'Mumbai Suburban', 'Maharashtra', '400051', '27AAACB2188E1ZT', 'Citibank India', '0341882901', 'CITI0000002', 'BKC Mumbai', 32000.00, 'Active', 'Crop protection products, fungicides, insecticides and herbicides'),
('SUP-005', 'Rasi Seeds Pvt Ltd', 'Seeds', '9849123414', 'sales@rasiseeds.com', '174 Sathyamangalam Road', 'Erode', 'Erode', 'Tamil Nadu', '638003', '33AAACR7812G1ZA', 'Canara Bank', '1209101034567', 'CNRB0001209', 'Erode Main', 8400.00, 'Active', 'Cotton Bt-II and hybrid vegetable seed specialists'),
('SUP-006', 'Mahindra Spares Depot', 'Farm Machinery', '9849123415', 'service@mahindraspares.in', 'Plot 12, Auto Nagar Service Road', 'Guntur', 'Guntur', 'Andhra Pradesh', '522001', '37AAACM3910L1Z4', 'State Bank of India', '31298456123', 'SBIN0000843', 'Guntur Bazaar', 18200.00, 'Active', 'OEM genuine spare parts for tractors, tillers, and rotavators'),
('SUP-007', 'Jain Irrigation Systems', 'Irrigation & Equipment', '9849123416', 'agri@jains.com', 'Jain Plastic Park, NH-6', 'Jalgaon', 'Jalgaon', 'Maharashtra', '425001', '27AAACJ0192Q1ZV', 'Bank of Baroda', '04870200001234', 'BARB0JALGAO', 'Jalgaon Main', 0.00, 'Active', 'Drip lines, micro-sprinklers, filters, and fertigation systems'),
('SUP-008', 'MaxCrop Agri Solutions', 'Bio-Inputs & Nutrients', '9849123417', 'hello@maxcrop.org', 'Phase 3, Industrial Area, Patancheru', 'Hyderabad', 'Sangareddy', 'Telangana', '502319', '36AAACM8912P1ZN', 'Axis Bank', '918020054321890', 'UTIB0000341', 'Patancheru', 5000.00, 'Active', 'Bio-fertilizers, organic manure, and micronutrient mixes'),
('SUP-009', 'GreenGrow Agro Inputs', 'Fertilizers', '9849123418', 'greengrow@agriinputs.com', 'Mandi Yard, Opp. Market Committee', 'Tenali', 'Guntur', 'Andhra Pradesh', '522201', '37AAACG1829B1Z2', 'Union Bank of India', '342102010045678', 'UBIN0534218', 'Tenali Market', 12000.00, 'Inactive', 'Seasonal dealer currently inactive pending license renewal');

INSERT INTO `supplier_transactions` (`transaction_code`, `transaction_date`, `supplier_id`, `supplier_name`, `transaction_type`, `reference_no`, `category`, `items_summary`, `amount`, `paid_amount`, `balance_amount`, `payment_status`, `notes`)
VALUES
('STX-001', '2026-10-15', 1, 'National Seeds Corporation', 'Purchase', 'INV-NSC-4421', 'Seeds', 'Paddy Seeds (BPT 5204 Samba Masuri) - 25 Bags @ ₹850', 21250.00, 21250.00, 0.00, 'Paid', 'Kharif season seed stock delivery verified'),
('STX-002', '2026-10-18', 2, 'IFFCO Agro Supplies', 'Purchase', 'INV-IFFCO-891', 'Fertilizers', 'Urea Granular Fertilizer (45kg) - 50 Bags @ ₹270', 13500.00, 13500.00, 0.00, 'Paid', 'Delivered directly to Farm 1 storage godown'),
('STX-003', '2026-10-22', 3, 'Coromandel Agro Chemicals', 'Purchase', 'INV-CORO-312', 'Fertilizers', 'DAP Complex (50kg) - 30 Bags @ ₹1,350', 40500.00, 25000.00, 15500.00, 'Partially Paid', 'Partial payment released, balance due upon final field application'),
('STX-004', '2026-10-25', 4, 'Bayer CropScience', 'Purchase', 'INV-BAY-902', 'Pesticides', 'Fipronil & Imidacloprid Insecticides - 20 Litres', 28400.00, 0.00, 28400.00, 'Pending', 'Pest protection spray stock for Chilli and Cotton'),
('STX-005', '2026-10-27', 6, 'Mahindra Spares Depot', 'Purchase', 'INV-MSD-119', 'Farm Machinery', 'Rotavator Heavy-Duty Blades set & Fuel Filter kit', 18200.00, 0.00, 18200.00, 'Pending', 'Maintenance parts for 45HP tractor'),
('STX-006', '2026-10-29', 5, 'Rasi Seeds Pvt Ltd', 'Purchase', 'INV-RASI-502', 'Seeds', 'Cotton Bt-II Hybrid Packets - 30 Pkts @ ₹920', 27600.00, 27600.00, 0.00, 'Paid', 'Certified seed packets for Block B');

INSERT INTO `supplier_payments` (`payment_code`, `payment_date`, `supplier_id`, `supplier_name`, `amount_paid`, `payment_mode`, `reference_no`, `bank_account`, `notes`)
VALUES
('SPY-001', '2026-10-16', 1, 'National Seeds Corporation', 21250.00, 'Bank Transfer', 'UTR-SBI-99238472', 'SBI Farm Operational A/C - 8812', 'Full settlement for invoice INV-NSC-4421'),
('SPY-002', '2026-10-20', 2, 'IFFCO Agro Supplies', 13500.00, 'UPI', 'UPI-984912-332', 'SBI Farm Operational A/C - 8812', 'Settlement for invoice INV-IFFCO-891 via UPI'),
('SPY-003', '2026-10-24', 3, 'Coromandel Agro Chemicals', 25000.00, 'Bank Transfer', 'UTR-HDFC-88123049', 'HDFC Agri Business A/C - 4102', 'Part payment for DAP shipment INV-CORO-312'),
('SPY-004', '2026-10-30', 5, 'Rasi Seeds Pvt Ltd', 27600.00, 'Bank Transfer', 'UTR-CAN-77182901', 'SBI Farm Operational A/C - 8812', 'Full payment for cotton seed delivery INV-RASI-502');
