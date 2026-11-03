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
