using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AgriMan.Expenses.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialExpenseCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "expense_categories",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    is_active = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_expense_categories", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "expense_transactions",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    expense_no = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    expense_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    farmer = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    farm = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    crop = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    category_id = table.Column<int>(type: "int", nullable: true),
                    expense_category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    supplier = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    payment_mode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Cash"),
                    reference_no = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    remarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Paid"),
                    receipt_attachment_url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_expense_transactions", x => x.id);
                    table.ForeignKey(
                        name: "FK_expense_transactions_expense_categories_category_id",
                        column: x => x.category_id,
                        principalTable: "expense_categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "expense_items",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    expense_id = table.Column<int>(type: "int", nullable: false),
                    item_name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    quantity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    unit = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "unit"),
                    unit_price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    total_amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    remarks = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_expense_items", x => x.id);
                    table.ForeignKey(
                        name: "FK_expense_items_expense_transactions_expense_id",
                        column: x => x.expense_id,
                        principalTable: "expense_transactions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "expense_payments",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    expense_id = table.Column<int>(type: "int", nullable: false),
                    payment_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    payment_mode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    bank_or_cash = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    reference_no = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Completed"),
                    remarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_expense_payments", x => x.id);
                    table.ForeignKey(
                        name: "FK_expense_payments_expense_transactions_expense_id",
                        column: x => x.expense_id,
                        principalTable: "expense_transactions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "expense_categories",
                columns: new[] { "id", "code", "created_at", "description", "is_active", "name" },
                values: new object[,]
                {
                    { 1, "FERTILIZERS", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Nutrients, chemical fertilizers, organic compost, urea, potash, and micronutrients", true, "Fertilizers" },
                    { 2, "LABOUR", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Daily wage labour, harvesting, weeding, sowing, sprayers, and farm workers", true, "Labour" },
                    { 3, "SEEDS", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Certified seeds, hybrid varieties, nursery saplings, and planting materials", true, "Seeds & Seedlings" },
                    { 4, "PESTICIDES", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Insecticides, fungicides, herbicides, biopesticides, and crop protectants", true, "Pesticides & Crop Protection" },
                    { 5, "MACHINERY", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Tractor rental, combine harvesters, rotavator, thresher, and machinery hire charges", true, "Machinery & Equipment Rental" },
                    { 6, "FUEL_ENERGY", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Diesel for tractors and water pumps, generator fuel, and farm electricity bills", true, "Fuel & Electricity" },
                    { 7, "IRRIGATION", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Borewell repairs, drip irrigation pipes, sprinkler maintenance, water tanker purchase", true, "Irrigation & Water" },
                    { 8, "VETERINARY", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Livestock fodder, cattle feed, vaccines, medicines, veterinary doctor charges", true, "Veterinary & Animal Feed" },
                    { 9, "LAND_RENT", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Annual farmland lease rent, agricultural warehouse storage rental fees", true, "Land Lease & Rent" },
                    { 10, "MISCELLANEOUS", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Fencing repairs, gunny bags, transport and haulage, miscellaneous farm expenses", true, "Miscellaneous & Maintenance" }
                });

            migrationBuilder.InsertData(
                table: "expense_transactions",
                columns: new[] { "id", "amount", "category_id", "created_at", "crop", "description", "expense_category", "expense_date", "expense_no", "farm", "farmer", "payment_mode", "receipt_attachment_url", "reference_no", "remarks", "status", "supplier", "updated_at" },
                values: new object[,]
                {
                    { 1, 18500.00m, 1, new DateTime(2026, 10, 22, 10, 0, 0, 0, DateTimeKind.Utc), "Paddy", "Urea and potash", "Fertilizers", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), "EXP-2026-0098", "North Field", "Arjun Mehta", "Bank", null, "UTR-09133", "Season initial fertilizer application", "Paid", "GreenGrow Supplies", null },
                    { 2, 8400.00m, 2, new DateTime(2026, 10, 18, 9, 30, 0, 0, DateTimeKind.Utc), "Cotton", "Weeding labour", "Labour", new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), "EXP-2026-0097", "Lake Farm", "Priya Sharma", "Cash", null, null, "Field work weeding stage 1", "Paid", "Village Labour Group", null }
                });

            migrationBuilder.InsertData(
                table: "expense_items",
                columns: new[] { "id", "created_at", "expense_id", "item_name", "quantity", "remarks", "total_amount", "unit", "unit_price" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 10, 22, 10, 0, 0, 0, DateTimeKind.Utc), 1, "Urea Fertilizer 50kg bag", 10m, "IFFCO Urea high quality", 11000.00m, "bags", 1100.00m },
                    { 2, new DateTime(2026, 10, 22, 10, 0, 0, 0, DateTimeKind.Utc), 1, "Muriate of Potash (MOP) 50kg bag", 5m, "Potash basal dressing", 7500.00m, "bags", 1500.00m },
                    { 3, new DateTime(2026, 10, 18, 9, 30, 0, 0, DateTimeKind.Utc), 2, "Manual Weeding Labour", 21m, "7 workers for 3 days weeding cotton field", 8400.00m, "man-days", 400.00m }
                });

            migrationBuilder.InsertData(
                table: "expense_payments",
                columns: new[] { "id", "amount", "bank_or_cash", "created_at", "expense_id", "payment_date", "payment_mode", "reference_no", "remarks", "status" },
                values: new object[,]
                {
                    { 1, 18500.00m, "State Bank of India (Current A/c)", new DateTime(2026, 10, 22, 10, 15, 0, 0, DateTimeKind.Utc), 1, new DateTime(2026, 10, 22, 10, 15, 0, 0, DateTimeKind.Utc), "Bank", "UTR-09133", "Direct RTGS/NEFT settlement to GreenGrow Supplies", "Completed" },
                    { 2, 8400.00m, "Cash in Hand", new DateTime(2026, 10, 18, 17, 0, 0, 0, DateTimeKind.Utc), 2, new DateTime(2026, 10, 18, 17, 0, 0, 0, DateTimeKind.Utc), "Cash", "CASH-VOUCHER-0097", "Disbursed to labour group head", "Completed" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_expense_categories_code",
                table: "expense_categories",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_expense_items_expense_id",
                table: "expense_items",
                column: "expense_id");

            migrationBuilder.CreateIndex(
                name: "IX_expense_payments_expense_id",
                table: "expense_payments",
                column: "expense_id");

            migrationBuilder.CreateIndex(
                name: "IX_expense_transactions_category_id",
                table: "expense_transactions",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "IX_expense_transactions_crop",
                table: "expense_transactions",
                column: "crop");

            migrationBuilder.CreateIndex(
                name: "IX_expense_transactions_expense_category",
                table: "expense_transactions",
                column: "expense_category");

            migrationBuilder.CreateIndex(
                name: "IX_expense_transactions_expense_date",
                table: "expense_transactions",
                column: "expense_date");

            migrationBuilder.CreateIndex(
                name: "IX_expense_transactions_expense_no",
                table: "expense_transactions",
                column: "expense_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_expense_transactions_farm",
                table: "expense_transactions",
                column: "farm");

            migrationBuilder.CreateIndex(
                name: "IX_expense_transactions_farmer",
                table: "expense_transactions",
                column: "farmer");

            migrationBuilder.CreateIndex(
                name: "IX_expense_transactions_payment_mode",
                table: "expense_transactions",
                column: "payment_mode");

            migrationBuilder.CreateIndex(
                name: "IX_expense_transactions_status",
                table: "expense_transactions",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_expense_transactions_supplier",
                table: "expense_transactions",
                column: "supplier");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "expense_items");

            migrationBuilder.DropTable(
                name: "expense_payments");

            migrationBuilder.DropTable(
                name: "expense_transactions");

            migrationBuilder.DropTable(
                name: "expense_categories");
        }
    }
}
