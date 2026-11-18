using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AgriMan.Unified.Api.Migrations.Farms
{
    /// <inheritdoc />
    public partial class InitialFarmUnified : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "farmers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FarmerCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FarmerName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    FatherOrHusbandName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Mobile = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    AlternateMobile = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AadhaarNo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Village = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Mandal = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    District = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TotalLand = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Active"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_farmers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "income_categories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_income_categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "irrigation_sources",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_irrigation_sources", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "product_categories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "soil_types",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_soil_types", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "units",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ShortCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_units", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "farmer_addresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FarmerId = table.Column<int>(type: "int", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    Village = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Mandal = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    District = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    State = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PinCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_farmer_addresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_farmer_addresses_farmers_FarmerId",
                        column: x => x.FarmerId,
                        principalTable: "farmers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "farmer_bank_accounts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FarmerId = table.Column<int>(type: "int", nullable: false),
                    BankName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    AccountNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IFSC = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_farmer_bank_accounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_farmer_bank_accounts_farmers_FarmerId",
                        column: x => x.FarmerId,
                        principalTable: "farmers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "farms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FarmerId = table.Column<int>(type: "int", nullable: false),
                    FarmName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    OwnershipType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Village = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Mandal = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    District = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    State = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Pincode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Active"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_farms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_farms_farmers_FarmerId",
                        column: x => x.FarmerId,
                        principalTable: "farmers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "suppliers",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FarmerId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    ContactPerson = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    GstNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_suppliers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_suppliers_farmers_FarmerId",
                        column: x => x.FarmerId,
                        principalTable: "farmers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "income_transactions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IncomeNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IncomeDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CategoryId = table.Column<int>(type: "int", nullable: false),
                    FarmerId = table.Column<int>(type: "int", nullable: true),
                    Farm = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Crop = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Buyer = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    GrossAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Discount = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    OtherCharges = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    NetAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "Completed"),
                    Remarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_income_transactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_income_transactions_farmers_FarmerId",
                        column: x => x.FarmerId,
                        principalTable: "farmers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_income_transactions_income_categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "income_categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "products",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    CategoryId = table.Column<int>(type: "int", nullable: false),
                    UnitId = table.Column<int>(type: "int", nullable: false),
                    ReorderLevel = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    StandardCost = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_products", x => x.Id);
                    table.ForeignKey(
                        name: "FK_products_product_categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "product_categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_products_units_UnitId",
                        column: x => x.UnitId,
                        principalTable: "units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "farm_documents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FarmId = table.Column<int>(type: "int", nullable: false),
                    DocumentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DocumentNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    FileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FileUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FileSize = table.Column<long>(type: "bigint", nullable: true),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_farm_documents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_farm_documents_farms_FarmId",
                        column: x => x.FarmId,
                        principalTable: "farms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "farm_land_details",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FarmId = table.Column<int>(type: "int", nullable: false),
                    SurveyNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    LandArea = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    AreaUnit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    LandType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IrrigationSourceId = table.Column<int>(type: "int", nullable: true),
                    SoilTypeId = table.Column<int>(type: "int", nullable: true),
                    BoundariesNorth = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    BoundariesSouth = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    BoundariesEast = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    BoundariesWest = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_farm_land_details", x => x.Id);
                    table.ForeignKey(
                        name: "FK_farm_land_details_farms_FarmId",
                        column: x => x.FarmId,
                        principalTable: "farms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_farm_land_details_irrigation_sources_IrrigationSourceId",
                        column: x => x.IrrigationSourceId,
                        principalTable: "irrigation_sources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_farm_land_details_soil_types_SoilTypeId",
                        column: x => x.SoilTypeId,
                        principalTable: "soil_types",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "purchases",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PurchaseNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PurchaseDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FarmerId = table.Column<int>(type: "int", nullable: false),
                    SupplierId = table.Column<long>(type: "bigint", nullable: false),
                    FarmId = table.Column<long>(type: "bigint", nullable: true),
                    CropId = table.Column<long>(type: "bigint", nullable: true),
                    SubTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    DiscountAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    TaxAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    PaidAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    BalanceAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    PaymentStatus = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "Pending"),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_purchases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_purchases_farmers_FarmerId",
                        column: x => x.FarmerId,
                        principalTable: "farmers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_purchases_suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "income_payments",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TransactionId = table.Column<long>(type: "bigint", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PaymentMode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    BankOrCash = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ReferenceNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PaymentDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_income_payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_income_payments_income_transactions_TransactionId",
                        column: x => x.TransactionId,
                        principalTable: "income_transactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "income_transaction_items",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TransactionId = table.Column<long>(type: "bigint", nullable: false),
                    ItemName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Rate = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_income_transaction_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_income_transaction_items_income_transactions_TransactionId",
                        column: x => x.TransactionId,
                        principalTable: "income_transactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "inventory",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    StorageLocation = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false, defaultValue: "Main Warehouse"),
                    CurrentStock = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    ReservedStock = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_inventory_products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "inventory_transactions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TransactionDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    TransactionType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    StorageLocation = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ReferenceType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ReferenceNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    BalanceAfterTransaction = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventory_transactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_inventory_transactions_products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "stock_adjustments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AdjustmentNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    AdjustmentDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    StorageLocation = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false, defaultValue: "Main Warehouse"),
                    BookStock = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PhysicalStock = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stock_adjustments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_stock_adjustments_products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "purchase_items",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PurchaseId = table.Column<long>(type: "bigint", nullable: false),
                    ProductName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Rate = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Discount = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    TaxRate = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    Total = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_purchase_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_purchase_items_purchases_PurchaseId",
                        column: x => x.PurchaseId,
                        principalTable: "purchases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "purchase_payments",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PurchaseId = table.Column<long>(type: "bigint", nullable: false),
                    PaymentDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PaymentMode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    BankOrCash = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ReferenceNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_purchase_payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_purchase_payments_purchases_PurchaseId",
                        column: x => x.PurchaseId,
                        principalTable: "purchases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "income_categories",
                columns: new[] { "Id", "Description", "IsActive", "Name" },
                values: new object[,]
                {
                    { 1, null, true, "Crop Sales" },
                    { 2, null, true, "Milk Sales" },
                    { 3, null, true, "Animal Sales" },
                    { 4, null, true, "Government Subsidy" },
                    { 5, null, true, "Loan Received" },
                    { 6, null, true, "Rental Income" },
                    { 7, null, true, "Other Income" }
                });

            migrationBuilder.InsertData(
                table: "irrigation_sources",
                columns: new[] { "Id", "Description", "IsActive", "Name" },
                values: new object[,]
                {
                    { 1, "Groundwater deep borewell extraction", true, "Borewell" },
                    { 2, "Government canal gravity irrigation", true, "Canal" },
                    { 3, "Precision drip micro-irrigation system", true, "Drip" },
                    { 4, "Monsoon seasonal rain-fed cultivation", true, "Rain-fed" },
                    { 5, "Overhead sprinkler distribution", true, "Sprinkler" },
                    { 6, "Lift irrigation from perennial river", true, "River Lift" }
                });

            migrationBuilder.InsertData(
                table: "product_categories",
                columns: new[] { "Id", "Description", "IsActive", "Name" },
                values: new object[,]
                {
                    { 1, "Agricultural seeds and saplings", true, "Seeds" },
                    { 2, "Organic and chemical fertilizers", true, "Fertilizers" },
                    { 3, "Insecticides, fungicides, and weedicides", true, "Pesticides" },
                    { 4, "Special spray formulations and micronutrients", true, "Sprayer chemicals" },
                    { 5, "Tractor, motor, and farm machinery spares", true, "Spare parts" },
                    { 6, "Pipes, ropes, tarpaulins, and farm tools", true, "Other consumables" }
                });

            migrationBuilder.InsertData(
                table: "soil_types",
                columns: new[] { "Id", "Description", "IsActive", "Name" },
                values: new object[,]
                {
                    { 1, "High clay content cotton soil", true, "Black Soil" },
                    { 2, "Iron-rich porous agricultural soil", true, "Red Soil" },
                    { 3, "River basin highly fertile silt soil", true, "Alluvial Soil" },
                    { 4, "Balanced moisture-retaining loam", true, "Clay Loam" },
                    { 5, "Fast-draining sandy loam soil", true, "Sandy Loam" },
                    { 6, "Acidic high rainfall region soil", true, "Laterite Soil" }
                });

            migrationBuilder.InsertData(
                table: "units",
                columns: new[] { "Id", "IsActive", "Name", "ShortCode" },
                values: new object[,]
                {
                    { 1, true, "Kilograms", "kg" },
                    { 2, true, "Grams", "g" },
                    { 3, true, "Litres", "L" },
                    { 4, true, "Millilitres", "ml" },
                    { 5, true, "Bags", "bag" },
                    { 6, true, "Packets", "pkt" },
                    { 7, true, "Bottles", "btl" },
                    { 8, true, "Pieces / Numbers", "nos" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_farm_documents_FarmId",
                table: "farm_documents",
                column: "FarmId");

            migrationBuilder.CreateIndex(
                name: "IX_farm_land_details_FarmId",
                table: "farm_land_details",
                column: "FarmId");

            migrationBuilder.CreateIndex(
                name: "IX_farm_land_details_IrrigationSourceId",
                table: "farm_land_details",
                column: "IrrigationSourceId");

            migrationBuilder.CreateIndex(
                name: "IX_farm_land_details_SoilTypeId",
                table: "farm_land_details",
                column: "SoilTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_farmer_addresses_FarmerId",
                table: "farmer_addresses",
                column: "FarmerId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_farmer_bank_accounts_FarmerId",
                table: "farmer_bank_accounts",
                column: "FarmerId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_farmers_FarmerCode",
                table: "farmers",
                column: "FarmerCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_farms_FarmerId",
                table: "farms",
                column: "FarmerId");

            migrationBuilder.CreateIndex(
                name: "IX_income_payments_TransactionId",
                table: "income_payments",
                column: "TransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_income_transaction_items_TransactionId",
                table: "income_transaction_items",
                column: "TransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_income_transactions_CategoryId",
                table: "income_transactions",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_income_transactions_FarmerId",
                table: "income_transactions",
                column: "FarmerId");

            migrationBuilder.CreateIndex(
                name: "IX_income_transactions_IncomeNo",
                table: "income_transactions",
                column: "IncomeNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inventory_ProductId_StorageLocation",
                table: "inventory",
                columns: new[] { "ProductId", "StorageLocation" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inventory_transactions_ProductId",
                table: "inventory_transactions",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_irrigation_sources_Name",
                table: "irrigation_sources",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_products_CategoryId",
                table: "products",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_products_Code",
                table: "products",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_products_UnitId",
                table: "products",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_purchase_items_PurchaseId",
                table: "purchase_items",
                column: "PurchaseId");

            migrationBuilder.CreateIndex(
                name: "IX_purchase_payments_PurchaseId",
                table: "purchase_payments",
                column: "PurchaseId");

            migrationBuilder.CreateIndex(
                name: "IX_purchases_FarmerId",
                table: "purchases",
                column: "FarmerId");

            migrationBuilder.CreateIndex(
                name: "IX_purchases_PurchaseNo",
                table: "purchases",
                column: "PurchaseNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_purchases_SupplierId",
                table: "purchases",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_soil_types_Name",
                table: "soil_types",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_stock_adjustments_AdjustmentNumber",
                table: "stock_adjustments",
                column: "AdjustmentNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_stock_adjustments_ProductId",
                table: "stock_adjustments",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_suppliers_FarmerId",
                table: "suppliers",
                column: "FarmerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "farm_documents");

            migrationBuilder.DropTable(
                name: "farm_land_details");

            migrationBuilder.DropTable(
                name: "farmer_addresses");

            migrationBuilder.DropTable(
                name: "farmer_bank_accounts");

            migrationBuilder.DropTable(
                name: "income_payments");

            migrationBuilder.DropTable(
                name: "income_transaction_items");

            migrationBuilder.DropTable(
                name: "inventory");

            migrationBuilder.DropTable(
                name: "inventory_transactions");

            migrationBuilder.DropTable(
                name: "purchase_items");

            migrationBuilder.DropTable(
                name: "purchase_payments");

            migrationBuilder.DropTable(
                name: "stock_adjustments");

            migrationBuilder.DropTable(
                name: "farms");

            migrationBuilder.DropTable(
                name: "irrigation_sources");

            migrationBuilder.DropTable(
                name: "soil_types");

            migrationBuilder.DropTable(
                name: "income_transactions");

            migrationBuilder.DropTable(
                name: "purchases");

            migrationBuilder.DropTable(
                name: "products");

            migrationBuilder.DropTable(
                name: "income_categories");

            migrationBuilder.DropTable(
                name: "suppliers");

            migrationBuilder.DropTable(
                name: "product_categories");

            migrationBuilder.DropTable(
                name: "units");

            migrationBuilder.DropTable(
                name: "farmers");
        }
    }
}
