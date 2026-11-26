-- ============================================================================
-- AGRIMAN Crop-wise Profit & Loss / Cross-Module Schema Alignment (MySQL 8.0+)
-- Idempotently adds missing EF Core columns to farms, income_categories,
-- income_transactions, expense_categories, and expense_transactions so
-- /api/crop-profitability and /api/Reports/* execute cleanly on MySQL.
-- ============================================================================

USE `agriman_db`;

DROP PROCEDURE IF EXISTS `sp_agriman_add_col_if_missing`;
DELIMITER $$
CREATE PROCEDURE `sp_agriman_add_col_if_missing`(
    IN p_table VARCHAR(64),
    IN p_col VARCHAR(64),
    IN p_definition VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table
          AND COLUMN_NAME = p_col
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_col, '` ', p_definition);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

-- 1. farms (Farm.cs)
CALL sp_agriman_add_col_if_missing('farms', 'State', "VARCHAR(100) NOT NULL DEFAULT 'Andhra Pradesh'");
CALL sp_agriman_add_col_if_missing('farms', 'Pincode', 'VARCHAR(10) NULL');
CALL sp_agriman_add_col_if_missing('farms', 'UpdatedAt', 'DATETIME NULL');

-- 2. income_categories (IncomeCategory.cs)
CALL sp_agriman_add_col_if_missing('income_categories', 'Code', 'VARCHAR(50) NULL');
CALL sp_agriman_add_col_if_missing('income_categories', 'Name', "VARCHAR(100) NOT NULL DEFAULT ''");
CALL sp_agriman_add_col_if_missing('income_categories', 'Source', 'VARCHAR(150) NULL');
CALL sp_agriman_add_col_if_missing('income_categories', 'IsActive', 'TINYINT(1) NOT NULL DEFAULT 1');
CALL sp_agriman_add_col_if_missing('income_categories', 'Status', "VARCHAR(30) NOT NULL DEFAULT 'Active'");
CALL sp_agriman_add_col_if_missing('income_categories', 'CreatedAt', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');

-- 2b. farm_land_details (FarmLandDetail.cs)
CALL sp_agriman_add_col_if_missing('farm_land_details', 'BoundariesNorth', 'VARCHAR(200) NULL');
CALL sp_agriman_add_col_if_missing('farm_land_details', 'BoundariesSouth', 'VARCHAR(200) NULL');
CALL sp_agriman_add_col_if_missing('farm_land_details', 'BoundariesEast', 'VARCHAR(200) NULL');
CALL sp_agriman_add_col_if_missing('farm_land_details', 'BoundariesWest', 'VARCHAR(200) NULL');
CALL sp_agriman_add_col_if_missing('farm_land_details', 'Remarks', 'VARCHAR(500) NULL');
CALL sp_agriman_add_col_if_missing('farm_land_details', 'UpdatedAt', 'DATETIME NULL');

-- 3. income_transactions (IncomeTransaction.cs)
CALL sp_agriman_add_col_if_missing('income_transactions', 'Farm', "VARCHAR(150) NOT NULL DEFAULT ''");
CALL sp_agriman_add_col_if_missing('income_transactions', 'Crop', 'VARCHAR(100) NULL');
CALL sp_agriman_add_col_if_missing('income_transactions', 'Buyer', "VARCHAR(150) NOT NULL DEFAULT ''");
CALL sp_agriman_add_col_if_missing('income_transactions', 'GrossAmount', 'DECIMAL(18,2) NOT NULL DEFAULT 0.00');
CALL sp_agriman_add_col_if_missing('income_transactions', 'Discount', 'DECIMAL(18,2) NOT NULL DEFAULT 0.00');
CALL sp_agriman_add_col_if_missing('income_transactions', 'OtherCharges', 'DECIMAL(18,2) NOT NULL DEFAULT 0.00');
CALL sp_agriman_add_col_if_missing('income_transactions', 'NetAmount', 'DECIMAL(18,2) NOT NULL DEFAULT 0.00');
CALL sp_agriman_add_col_if_missing('income_transactions', 'Status', "VARCHAR(30) NOT NULL DEFAULT 'Completed'");

-- 4. expense_transactions (ExpenseTransaction.cs)
CALL sp_agriman_add_col_if_missing('expense_transactions', 'expense_no', "VARCHAR(50) NOT NULL DEFAULT ''");
CALL sp_agriman_add_col_if_missing('expense_transactions', 'expense_date', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL sp_agriman_add_col_if_missing('expense_transactions', 'farmer', "VARCHAR(100) NOT NULL DEFAULT ''");
CALL sp_agriman_add_col_if_missing('expense_transactions', 'farm', "VARCHAR(100) NOT NULL DEFAULT ''");
CALL sp_agriman_add_col_if_missing('expense_transactions', 'crop', "VARCHAR(100) NOT NULL DEFAULT ''");
CALL sp_agriman_add_col_if_missing('expense_transactions', 'category_id', 'INT NULL');
CALL sp_agriman_add_col_if_missing('expense_transactions', 'expense_category', "VARCHAR(100) NOT NULL DEFAULT ''");
CALL sp_agriman_add_col_if_missing('expense_transactions', 'supplier', "VARCHAR(150) NOT NULL DEFAULT ''");
CALL sp_agriman_add_col_if_missing('expense_transactions', 'payment_mode', "VARCHAR(50) NOT NULL DEFAULT 'Cash'");
CALL sp_agriman_add_col_if_missing('expense_transactions', 'reference_no', 'VARCHAR(100) NULL');
CALL sp_agriman_add_col_if_missing('expense_transactions', 'status', "VARCHAR(50) NOT NULL DEFAULT 'Paid'");
CALL sp_agriman_add_col_if_missing('expense_transactions', 'receipt_attachment_url', 'VARCHAR(500) NULL');
CALL sp_agriman_add_col_if_missing('expense_transactions', 'created_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL sp_agriman_add_col_if_missing('expense_transactions', 'updated_at', 'DATETIME NULL');

-- 5. expense_categories (ExpenseCategory.cs)
CALL sp_agriman_add_col_if_missing('expense_categories', 'code', "VARCHAR(50) NOT NULL DEFAULT ''");
CALL sp_agriman_add_col_if_missing('expense_categories', 'name', "VARCHAR(100) NOT NULL DEFAULT ''");
CALL sp_agriman_add_col_if_missing('expense_categories', 'is_active', 'TINYINT(1) NOT NULL DEFAULT 1');
CALL sp_agriman_add_col_if_missing('expense_categories', 'created_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');

-- 6. purchases (Purchase.cs)
CALL sp_agriman_add_col_if_missing('purchases', 'FarmId', 'BIGINT NULL');
CALL sp_agriman_add_col_if_missing('purchases', 'CropId', 'BIGINT NULL');

DROP PROCEDURE IF EXISTS `sp_agriman_add_col_if_missing`;
