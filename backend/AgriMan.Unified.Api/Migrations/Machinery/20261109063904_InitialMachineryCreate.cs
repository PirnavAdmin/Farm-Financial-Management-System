using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Agriman.Machinery.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialMachineryCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "machinery",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MachineName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    MachineType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    RegistrationNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PurchaseDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PurchaseCost = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    CurrentValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    FuelType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Active"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_machinery", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "machinery_expense_types",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_machinery_expense_types", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "machinery_expenses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MachineryId = table.Column<int>(type: "int", nullable: true),
                    MachineName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    ExpenseType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Operator = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_machinery_expenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_machinery_expenses_machinery_MachineryId",
                        column: x => x.MachineryId,
                        principalTable: "machinery",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.InsertData(
                table: "machinery_expense_types",
                columns: new[] { "Id", "Code", "CreatedAt", "Description", "IsActive", "Name" },
                values: new object[,]
                {
                    { 1, "FUEL", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Diesel, petrol, electric charging, and lubricants for farm machinery", true, "Fuel" },
                    { 2, "MAINTENANCE", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Scheduled servicing, oil change, filter replacement, and routine checks", true, "Maintenance" },
                    { 3, "REPAIR", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Breakdown repairs, spare parts, tyres, and workshop labour", true, "Repair & Spare Parts" },
                    { 4, "OPERATOR_WAGES", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Driver and machinery operator daily or monthly wages", true, "Operator Wages" },
                    { 5, "INSURANCE", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Machinery insurance premiums, permits, and registration renewals", true, "Insurance & Registration" },
                    { 6, "OTHER", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Miscellaneous machinery operating and handling expenses", true, "Other" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_machinery_MachineName",
                table: "machinery",
                column: "MachineName");

            migrationBuilder.CreateIndex(
                name: "IX_machinery_MachineType",
                table: "machinery",
                column: "MachineType");

            migrationBuilder.CreateIndex(
                name: "IX_machinery_RegistrationNo",
                table: "machinery",
                column: "RegistrationNo",
                unique: true,
                filter: "[RegistrationNo] IS NOT NULL AND [RegistrationNo] <> ''");

            migrationBuilder.CreateIndex(
                name: "IX_machinery_Status",
                table: "machinery",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_machinery_expense_types_Code",
                table: "machinery_expense_types",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_machinery_expenses_Date",
                table: "machinery_expenses",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_machinery_expenses_ExpenseType",
                table: "machinery_expenses",
                column: "ExpenseType");

            migrationBuilder.CreateIndex(
                name: "IX_machinery_expenses_MachineName",
                table: "machinery_expenses",
                column: "MachineName");

            migrationBuilder.CreateIndex(
                name: "IX_machinery_expenses_MachineryId",
                table: "machinery_expenses",
                column: "MachineryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "machinery_expense_types");

            migrationBuilder.DropTable(
                name: "machinery_expenses");

            migrationBuilder.DropTable(
                name: "machinery");
        }
    }
}
