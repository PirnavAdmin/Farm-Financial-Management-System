# 🌾 AGRIMAN Unified Farm Financial & Operations Platform (Database: `Farmersdb`)

This repository merges and unifies:
1. `c:\Users\ADMIN\OneDrive\Desktop\farmer_project`
2. `c:\Users\ADMIN\Downloads\Farm Financial Management Sys Updated 1\Farm Financial Management Sys\Farm Financial Management Sys\FarmManagementApi`

Into a single, production-ready ASP.NET Core (.NET 8) Web API project connecting to Microsoft SQL Server:
- **Server**: `NIRANJAN\SQLEXPRESS`
- **Database**: `Farmersdb`
- **Authentication**: Windows Integrated (`Trusted_Connection=True;TrustServerCertificate=True;`)

---

## 🏗️ Merged Modules & Endpoints Overview

| Module # | Module Name | Primary Endpoints | Database Tables in `Farmersdb` |
|:---|:---|:---|:---|
| **1** | **Auth & User Administration** | `POST /api/auth/register`<br>`POST /api/auth/login`<br>`POST /api/auth/forgot-password`<br>`POST /api/auth/verify-otp`<br>`POST /api/auth/reset-password`<br>`GET/POST/PUT/DELETE /api/users`<br>`GET /api/roles`, `GET /api/permissions` | `users`<br>`roles`<br>`permissions`<br>`user_roles`<br>`role_permissions`<br>`user_permissions`<br>`login_history`<br>`password_resets` |
| **2** | **Farmers Registry, Address & Bank** | `GET/POST /api/farmers`<br>`GET/PUT/DELETE /api/farmers/{id}`<br>`GET /api/farmers/code/{code}`<br>`GET /api/farmers/{id}/lands`<br>`PATCH /api/farmers/{id}/status`<br>`/api/farmeraddresses`<br>`/api/farmerbankaccounts` | `farmers`<br>`farmer_addresses`<br>`farmer_bank_accounts` |
| **3** | **Farm & Land Holdings** | `GET/POST/PUT/DELETE /api/farms`<br>`GET/POST/PUT/DELETE /api/farmlanddetails`<br>`POST /api/farmdocuments/upload`<br>`GET /api/masters/irrigation-sources`<br>`GET /api/masters/soil-types` | `farms`<br>`farm_land_details`<br>`farm_documents`<br>`irrigation_sources`<br>`soil_types` |
| **4** | **Income Management** | `GET /api/income/categories`<br>`GET/POST /api/income`<br>`GET /api/income/{id}`<br>`POST /api/income/{id}/payments`<br>`GET /api/income/summary` | `income_categories`<br>`income_transactions`<br>`income_transaction_items`<br>`income_payments` |
| **5** | **Purchases & Suppliers** | `GET/POST/PUT/DELETE /api/suppliers`<br>`GET/POST /api/purchases`<br>`GET /api/purchases/{id}`<br>`POST /api/purchases/{id}/payments` | `suppliers`<br>`purchases`<br>`purchase_items`<br>`purchase_payments` |
| **6** | **Inventory & Agricultural Inputs** | `GET/POST /api/products`<br>`GET /api/products/categories`<br>`GET /api/products/units`<br>`GET/POST /api/inventory/stock-in`<br>`GET/POST /api/inventory/stock-out`<br>`POST /api/inventory/adjustments` | `product_categories`<br>`units`<br>`products`<br>`inventory`<br>`inventory_transactions`<br>`stock_adjustments` |
| **7** | **Expenditures & Financial Ledger** | `GET/POST /api/expenses`<br>`GET/PUT/DELETE /api/expenses/{id}`<br>`GET /api/expenses/summary`<br>`GET /api/expenses/next-number`<br>`GET /api/expenses/export/csv`<br>`/api/expensecategories` | `expense_categories`<br>`expense_transactions`<br>`expense_items`<br>`expense_payments` |
| **8** | **Produce Sales Management** | `GET/POST /api/sales`<br>`GET/PUT/DELETE /api/sales/{id}`<br>`GET /api/sales/summary`<br>`POST /api/sales/seed`<br>`GET /index.html` (Sales UI) | `Sales` |
| **9** | **Machinery & Equipment** | `GET/POST /api/machinery`<br>`GET/PUT/DELETE /api/machinery/{id}`<br>`GET /api/machinery/summary`<br>`GET /api/machinery/lookups`<br>`GET/POST /api/machinery-expenses`<br>`GET /api/machinery-expenses/types` | `machinery`<br>`machinery_expenses`<br>`machinery_expense_types` |
| **0** | **Unified Total Data & Health** | `GET /api/total-data`<br>`GET /api/total-data/summary`<br>`GET /api/health` | Cross-module read across all tables in `Farmersdb` |
| **EF Core** | **Isolated Migration Trackers** | Automated schema synchronization | `__EFMigrationsHistory_Auth`<br>`__EFMigrationsHistory_Farms`<br>`__EFMigrationsHistory_Expenses`<br>`__EFMigrationsHistory_Sales`<br>`__EFMigrationsHistory_Machinery` |

**Total Database Tables in `Farmersdb`**: **43 Tables** (38 operational business tables + 5 EF migration history tables).

---

## 🚀 How to Run the Unified Application

### Option 1: 1-Click Runner (Backend + ngrok Tunnel)
Double-click `run-api-and-ngrok.bat` (or execute `.\start-server.ps1` in PowerShell).
This script:
1. Cleans up any prior processes on port `5200`.
2. Starts the Unified Backend on port `5200`.
3. Runs the bundled `ngrok.exe` tunnel for external testing.
4. Auto-detects public HTTPS endpoints.

### Option 2: Run via .NET CLI
```bash
dotnet run --urls "http://0.0.0.0:5200"
```

### Option 3: Visual Studio
Open the project directory in Visual Studio or VS Code and press `F5` / `Ctrl+F5`.

---

## 🌐 URLs & Dashboards

- **Swagger UI Interactive Dashboard**: `http://localhost:5200/swagger`
  - Dropdown selector allows viewing **All Modules Together** or filtering by individual module (Auth, Farmers, Farms, Income, Purchases, Inventory, Expenses, Sales).
- **Sales Web Interface**: `http://localhost:5200/index.html`
- **System Health Check**: `http://localhost:5200/health`

---

## 🛠️ Applying / Updating Migrations

All migrations have been generated and applied to `NIRANJAN\SQLEXPRESS` (`Farmersdb`).
To re-apply or update migrations in the future:

```bash
# 1. Auth module
dotnet ef database update --context ApplicationDbContext

# 2. Farm Management (Farmers, Farms, Lands, Income, Purchases, Inventory)
dotnet ef database update --context FarmDbContext

# 3. Expenses module
dotnet ef database update --context ExpenseDbContext

# 4. Sales module
dotnet ef database update --context SalesDbContext

# 5. Machinery module
dotnet ef database update --context MachineryDbContext
```
