using System.Reflection;
using System.Text;
using System.Text.Json.Serialization;
using AgriMan.Api.Data;
using AgriMan.Api.Services;
using FarmManagementApi.Data;
using AgriMan.Expenses.Api.Data;
using Agriman.Machinery.Api.Data;
using Agriman.Machinery.Api.Serialization;
using SalesApi.Data;
using SalesApi.Models;
using SalesApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

var builder = WebApplication.CreateBuilder(args);

// Ensure server binds to port 5147 & 5200 by default across all execution modes
if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ASPNETCORE_URLS")))
{
    builder.WebHost.UseUrls("http://0.0.0.0:5147", "http://0.0.0.0:5200");
}

// Ensure wwwroot directory exists for file uploads (e.g. Farm documents, frontend UI)
var webRootDir = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
if (!Directory.Exists(webRootDir))
{
    Directory.CreateDirectory(webRootDir);
}

// -----------------------------------------------------------------------------
// 1. UNIFIED SINGLE DATABASE CONFIGURATION: [agriman_db] on MySQL (localhost:3306)
// All modules store data in MySQL agriman_db
// -----------------------------------------------------------------------------
var mySqlConnectionString = builder.Configuration.GetConnectionString("FarmerDbConnection")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=localhost;Port=3306;Database=agriman_db;User=root;Password=root;CharSet=utf8mb4;";

var mySqlServerVersion = new MySqlServerVersion(new Version(8, 0, 46));

// API 1: Auth & User Management DbContext -> agriman_db
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(mySqlConnectionString, mySqlServerVersion, sqlOptions =>
    {
        sqlOptions.MigrationsHistoryTable("__EFMigrationsHistory_Auth");
        sqlOptions.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null);
        sqlOptions.CommandTimeout(120);
    }));

// API 2: Farm Management DbContext (Farmers, Farms, Lands, Income, Purchases, Inventory) -> agriman_db
builder.Services.AddDbContext<FarmDbContext>(options =>
    options.UseMySql(mySqlConnectionString, mySqlServerVersion, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null);
        sqlOptions.CommandTimeout(120);
    }));

// API 3: Expenses & Financial Management DbContext -> agriman_db
builder.Services.AddDbContext<ExpenseDbContext>(options =>
    options.UseMySql(mySqlConnectionString, mySqlServerVersion, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null);
        sqlOptions.CommandTimeout(120);
    }));

// API 4: Sales Management DbContext -> agriman_db
builder.Services.AddDbContext<SalesDbContext>(options =>
    options.UseMySql(mySqlConnectionString, mySqlServerVersion, sqlOptions =>
    {
        sqlOptions.MigrationsHistoryTable("__EFMigrationsHistory_Sales");
        sqlOptions.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null);
        sqlOptions.CommandTimeout(120);
    }));

// API 5: Machinery & Operating Expenses DbContext -> agriman_db
builder.Services.AddDbContext<MachineryDbContext>(options =>
    options.UseMySql(mySqlConnectionString, mySqlServerVersion, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null);
        sqlOptions.CommandTimeout(120);
    }));

// -----------------------------------------------------------------------------
// 2. DEPENDENCY INJECTION SERVICES
// -----------------------------------------------------------------------------
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<ISalesService, SalesService>();
builder.Services.AddScoped<FarmManagementApi.Services.IInventoryService, FarmManagementApi.Services.InventoryService>();
builder.Services.AddScoped<FarmManagementApi.Services.IPaymentReceiptService, FarmManagementApi.Services.PaymentReceiptService>();
builder.Services.AddHttpContextAccessor();

// -----------------------------------------------------------------------------
// 3. CONTROLLERS & JSON CONFIGURATION
// -----------------------------------------------------------------------------
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.Converters.Add(new FlexibleNullableDateTimeConverter());
        options.JsonSerializerOptions.Converters.Add(new FlexibleNullableDecimalConverter());
    });

// -----------------------------------------------------------------------------
// 4. JWT AUTHENTICATION
// -----------------------------------------------------------------------------
var jwtKey = builder.Configuration["Jwt:Key"] ?? "AGRIMAN_SUPER_SECURE_JWT_SECRET_KEY_FOR_AUTHENTICATION_2026_!@#$%^";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "AGRIMAN_API";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "AGRIMAN_Frontend";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// -----------------------------------------------------------------------------
// 5. CORS CONFIGURATION (Frontend & ngrok Integration)
// -----------------------------------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader()
              .WithExposedHeaders("ngrok-skip-browser-warning", "Content-Disposition");
    });
});

// Configure Forwarded Headers for ngrok / reverse proxy
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// -----------------------------------------------------------------------------
// 6. SWAGGER / OPENAPI SPECIFICATION
// -----------------------------------------------------------------------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    // Combined / Unified View
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "AGRIMAN Unified Platform - All Modules (Database: Farmersdb)",
        Version = "v1",
        Description = "### ðŸŒ¾ Comprehensive Unified Farm Financial & Operations Platform API\n" +
                      "Unified ASP.NET Core (.NET 8) platform storing all data in **`Farmersdb`** on `NIRANJAN\\SQLEXPRESS`:\n\n" +
                      "- **1. Auth & User API**: JWT Login, Registration, OTP Password Reset, Roles, Permissions\n" +
                      "- **2. Farmer Registry**: Profiles, Aadhaar, Land Holding, Addresses, Bank Accounts\n" +
                      "- **3. Farm Management**: Farms, Land Details, Survey Numbers, Soil Types, Irrigation, Documents\n" +
                      "- **4. Income Management**: Categories, Transactions, Items, Payment Receipts\n" +
                      "- **5. Purchases & Suppliers**: Vendor Profiles, Purchase Orders, Line Items, Disbursements\n" +
                      "- **6. Inventory & Products**: Agricultural Inputs, Stock In/Out, Stock Adjustments\n" +
                      "- **7. Expenses API**: Financial Ledger, Categories, Expense Items, Disbursements, CSV Export\n" +
                      "- **8. Sales API**: Crop Sales Records, Analytics Summary, Auto Calculations, Seed Data\n" +
                      "- **09. Purchases & Inward Orders**: Agricultural Purchase Orders, Vendor Invoices & Payments\n" +
                      "- **10. Labour Management API**: Workers, Daily Attendance & Wage Disbursements\n" +
                      "- **13. Machinery & Equipment API**: Farm Machinery Fleet, Lookups, Operating Expenses & ROI\n" +
                      "- **14. Loan & Finance API**: Agricultural Loans, Repayment Schedules & EMI Calculator\n" +
                      "- **15. Supplier Management API**: Agro-dealers, Purchase Invoices, Payments & Khata Ledger\n" +
                      "- **16. Buyer Management API**: Wholesale Produce Buyers, Commission Agents & Receivables\n" +
                      "- **00. Unified Overview**: Cross-module Total Data (`/api/total-data`) & System Health (`/api/health`)\n\n" +
                      "**Database Server**: `NIRANJAN\\SQLEXPRESS` | **Database**: `Farmersdb`",
        Contact = new OpenApiContact { Name = "AGRIMAN Engineering", Email = "support@agriman.in" }
    });

    c.SwaggerDoc("auth", new OpenApiInfo
    {
        Title = "1. Auth & User API - Farmersdb",
        Version = "v1",
        Description = "Authentication, JWT tokens, OTP password reset, and user admin in `Farmersdb`."
    });

    c.SwaggerDoc("farmers", new OpenApiInfo
    {
        Title = "2. Farmers, Addresses & Bank Accounts API - Farmersdb",
        Version = "v1",
        Description = "Farmer registry, personal profiles, addresses, and bank accounts in `Farmersdb`."
    });

    c.SwaggerDoc("farms", new OpenApiInfo
    {
        Title = "3. Farms & Land Holdings API - Farmersdb",
        Version = "v1",
        Description = "Farm holdings, land parcels, survey numbers, irrigation sources, soil types, and document vault in `Farmersdb`."
    });

    c.SwaggerDoc("income", new OpenApiInfo
    {
        Title = "4. Income Management API - Farmersdb",
        Version = "v1",
        Description = "Farm income categories, crop revenue transactions, line items, and payment receipts in `Farmersdb`."
    });

    c.SwaggerDoc("crops", new OpenApiInfo
    {
        Title = "5. Crop & Season Management API - Farmersdb",
        Version = "v1",
        Description = "Crop varieties, growth cycles, categories, and seasonal farming schedules in `Farmersdb`."
    });

    c.SwaggerDoc("inventory", new OpenApiInfo
    {
        Title = "6. Inventory & Products API - Farmersdb",
        Version = "v1",
        Description = "Products, categories, units of measurement, stock ledger transactions, and physical adjustments in `Farmersdb`."
    });

    c.SwaggerDoc("expenses", new OpenApiInfo
    {
        Title = "7. Expenses API - Farmersdb",
        Version = "v1",
        Description = "Farm expenditures ledger, overhead categories, vouchers, line items, and CSV export in `Farmersdb`."
    });

    c.SwaggerDoc("sales", new OpenApiInfo
    {
        Title = "8. Sales API - Farmersdb",
        Version = "v1",
        Description = "Crop produce sales transactions, revenue summary metrics, and analytics in `Farmersdb`."
    });

    c.SwaggerDoc("purchases", new OpenApiInfo
    {
        Title = "09. Purchase Orders & Inward Bills API - Farmersdb",
        Version = "v1",
        Description = "Agricultural purchase orders, vendor invoices, line items, and payment tracking in `Farmersdb`."
    });

    c.SwaggerDoc("labour", new OpenApiInfo
    {
        Title = "10. Labour Management API - Farmersdb (Module 10)",
        Version = "v1",
        Description = "Farm workers registry, daily attendance rosters, piece-rate and daily wage payments in `Farmersdb`."
    });

    c.SwaggerDoc("finance", new OpenApiInfo
    {
        Title = "11. Finance, Bank Accounts & Reports API - Farmersdb (Module 11)",
        Version = "v1",
        Description = "Module 11: Treasury bank accounts, centralized finance payments, receipts, and P&L / cash flow analytics in `Farmersdb`."
    });

    c.SwaggerDoc("machinery", new OpenApiInfo
    {
        Title = "13. Machinery & Equipment API - Farmersdb",
        Version = "v1",
        Description = "Module 13: Farm machinery fleet registry, lookups, operating expenses, and fleet ROI analytics in `Farmersdb`."
    });

    c.SwaggerDoc("loans", new OpenApiInfo
    {
        Title = "14. Loan & Finance API - Farmersdb",
        Version = "v1",
        Description = "Module 14: Agricultural farm loans, bank credit lines, repayment schedules, EMI calculator, and loan payment ledger in `Farmersdb`."
    });

    c.SwaggerDoc("suppliers", new OpenApiInfo
    {
        Title = "15. Supplier Management API - Farmersdb",
        Version = "v1",
        Description = "Module 15: Agricultural suppliers directory, supplier transactions, supplier payments, and ledger statement in `Farmersdb`."
    });

    c.SwaggerDoc("buyers", new OpenApiInfo
    {
        Title = "16. Buyer & Customer Management API - Farmersdb",
        Version = "v1",
        Description = "Wholesale buyers, commission agents, trader directories, and receivable accounts in `Farmersdb`."
    });

    c.SwaggerDoc("payments-receipts", new OpenApiInfo
    {
        Title = "17. Payment & Receipt Management API - Farmersdb",
        Version = "v1",
        Description = "Module 17: Outgoing payments, incoming receipts, printable vouchers, 12-dimension outflow/collection analytics, CSV exports, bank balance auto-sync, and audit trail in `Farmersdb`."
    });

    // Filter endpoints into dropdown views
    c.DocInclusionPredicate((docName, apiDesc) =>
    {
        if (docName == "v1") return true;

        var descriptor = apiDesc.ActionDescriptor as ControllerActionDescriptor;
        if (descriptor == null) return false;

        var ns = descriptor.ControllerTypeInfo.Namespace ?? "";
        var name = descriptor.ControllerTypeInfo.Name;

        if (docName == "auth")
        {
            return ns.Contains("AgriMan.Api") || name.StartsWith("Auth") || name.StartsWith("User") || name.StartsWith("Role") || name.StartsWith("Permission") || name.StartsWith("Company") || name.StartsWith("AuditLog") || name.StartsWith("LoginHistory");
        }
        if (docName == "farmers")
        {
            return name.StartsWith("Farmer") || name.StartsWith("RentalLand");
        }
        if (docName == "farms")
        {
            return name.StartsWith("Farm") || name.StartsWith("RentalLand") || name.StartsWith("Master") || name.StartsWith("Dashboard") || name.StartsWith("TotalData") || name.StartsWith("Health");
        }
        if (docName == "income")
        {
            return name.StartsWith("Income");
        }
        if (docName == "crops")
        {
            return name.StartsWith("Crop");
        }
        if (docName == "inventory")
        {
            return name.StartsWith("Inventory") || name.StartsWith("Product") || name.StartsWith("Unit");
        }
        if (docName == "expenses")
        {
            return ns.Contains("AgriMan.Expenses") || name.StartsWith("Expense");
        }
        if (docName == "sales")
        {
            return ns.Contains("Sales") || name.StartsWith("Sale");
        }
        if (docName == "labour")
        {
            return name.StartsWith("Labour");
        }
        if (docName == "finance")
        {
            return name.StartsWith("Bank") || name.StartsWith("Finance") || name.StartsWith("Report");
        }
        if (docName == "machinery")
        {
            return ns.Contains("Agriman.Machinery") || name.StartsWith("Machinery");
        }
        if (docName == "loans")
        {
            return name.StartsWith("Loan");
        }
        if (docName == "purchases")
        {
            return name.StartsWith("Purchase");
        }
        if (docName == "suppliers")
        {
            return name.StartsWith("Supplier");
        }
        if (docName == "buyers")
        {
            return name.StartsWith("Buyer");
        }
        if (docName == "payments-receipts")
        {
            return name.StartsWith("FinancePayment") || name.StartsWith("FinanceReceipt");
        }

        return false;
    });

    // Tag actions by category
    c.TagActionsBy(apiDesc =>
    {
        var descriptor = apiDesc.ActionDescriptor as ControllerActionDescriptor;
        var controllerName = descriptor?.ControllerName ?? "General";
        var ns = descriptor?.ControllerTypeInfo.Namespace ?? "";

        // 00. Unified Dashboard, Overview & Health
        if (controllerName.Equals("Dashboard", StringComparison.OrdinalIgnoreCase)) return new[] { "00. Dashboard - Multi-Farm Performance & Analytics (Module 0)" };
        if (controllerName.Equals("TotalData", StringComparison.OrdinalIgnoreCase)) return new[] { "00. Overview - Cross-Module System Data (Module 0)" };
        if (controllerName.Equals("Health", StringComparison.OrdinalIgnoreCase)) return new[] { "00. Overview - Health & Migrations (Module 0)" };

        // 01. Auth & Users
        if (ns.Contains("AgriMan.Api") || controllerName.Equals("Auth", StringComparison.OrdinalIgnoreCase) || controllerName.Equals("Users", StringComparison.OrdinalIgnoreCase) || controllerName.Equals("Roles", StringComparison.OrdinalIgnoreCase) || controllerName.Equals("Permissions", StringComparison.OrdinalIgnoreCase) || controllerName.Equals("Company", StringComparison.OrdinalIgnoreCase) || controllerName.Equals("AuditLogs", StringComparison.OrdinalIgnoreCase) || controllerName.Equals("LoginHistory", StringComparison.OrdinalIgnoreCase))
        {
            if (controllerName.Equals("Auth", StringComparison.OrdinalIgnoreCase)) return new[] { "01. Auth - Authentication (Login / Register / OTP / Refresh) (Module 1)" };
            if (controllerName.Equals("Users", StringComparison.OrdinalIgnoreCase)) return new[] { "01. Auth - User Administration & Stats (Module 1)" };
            if (controllerName.Equals("Roles", StringComparison.OrdinalIgnoreCase) || controllerName.Equals("Permissions", StringComparison.OrdinalIgnoreCase)) return new[] { "01. Auth - Roles & Permissions (Module 1)" };
            if (controllerName.Equals("Company", StringComparison.OrdinalIgnoreCase)) return new[] { "01. Auth - Company Settings (Module 1)" };
            if (controllerName.Equals("AuditLogs", StringComparison.OrdinalIgnoreCase) || controllerName.Equals("LoginHistory", StringComparison.OrdinalIgnoreCase)) return new[] { "01. Auth - Audit Logs & Login History (Module 1)" };
            return new[] { "01. Auth & User API (Module 1)" };
        }

        // 02. Farmers, Address & Bank
        if (controllerName.Equals("Farmers", StringComparison.OrdinalIgnoreCase)) return new[] { "02. Farmers - Farmer Registry & Profiles (Module 2)" };
        if (controllerName.Equals("FarmerAddresses", StringComparison.OrdinalIgnoreCase)) return new[] { "02. Farmers - Farmer Addresses (Module 2)" };
        if (controllerName.Equals("FarmerBankAccounts", StringComparison.OrdinalIgnoreCase)) return new[] { "02. Farmers - Farmer Bank Accounts (Module 2)" };

        // 03. Farms & Land Management
        if (controllerName.Equals("Farms", StringComparison.OrdinalIgnoreCase)) return new[] { "03. Farms - Farm Profiles (Module 3)" };
        if (controllerName.Equals("FarmLandDetails", StringComparison.OrdinalIgnoreCase)) return new[] { "03. Farms - Land & Soil Details (Module 3)" };
        if (controllerName.Equals("RentalLands", StringComparison.OrdinalIgnoreCase)) return new[] { "03. Farms - Rental Land Details (Module 3)" };
        if (controllerName.Equals("FarmDocuments", StringComparison.OrdinalIgnoreCase)) return new[] { "03. Farms - Farm Documents Vault (Module 3)" };
        if (controllerName.Equals("Masters", StringComparison.OrdinalIgnoreCase)) return new[] { "03. Farms - Master Lookups (Soil & Irrigation) (Module 3)" };

        // 04. Income Management
        if (controllerName.Equals("Income", StringComparison.OrdinalIgnoreCase)) return new[] { "04. Income - Categories, Inward Transactions & Payments (Module 4)" };

        // 05. Crop Management
        if (controllerName.StartsWith("Crop", StringComparison.OrdinalIgnoreCase)) return new[] { "05. Crops - Crop Profiles, Categories, Varieties & Seasons (Module 5)" };

        // 06. Inventory & Agricultural Inputs
        if (controllerName.Equals("ProductCategories", StringComparison.OrdinalIgnoreCase)) return new[] { "06. Inventory - Product Categories (Module 6)" };
        if (controllerName.Equals("Units", StringComparison.OrdinalIgnoreCase)) return new[] { "06. Inventory - Units of Measurement (Module 6)" };
        if (controllerName.Equals("Products", StringComparison.OrdinalIgnoreCase)) return new[] { "06. Inventory - Agricultural Products & Categories (Module 6)" };
        if (controllerName.Equals("Inventory", StringComparison.OrdinalIgnoreCase)) return new[] { "06. Inventory - Stock In, Stock Out & Adjustments (Module 6)" };

        // 07. Expenses API
        if (ns.Contains("AgriMan.Expenses") || controllerName.Equals("Expenses", StringComparison.OrdinalIgnoreCase) || controllerName.Equals("ExpenseCategories", StringComparison.OrdinalIgnoreCase))
        {
            if (controllerName.Equals("Expenses", StringComparison.OrdinalIgnoreCase)) return new[] { "07. Expenses - Financial Ledger & Vouchers (Module 7)" };
            if (controllerName.Equals("ExpenseCategories", StringComparison.OrdinalIgnoreCase)) return new[] { "07. Expenses - Overhead Categories (Module 7)" };
            return new[] { "07. Expenses API (Module 7)" };
        }

        // 08. Sales API
        if (controllerName.Equals("Sales", StringComparison.OrdinalIgnoreCase)) return new[] { "08. Sales - Crop Sales & Line Items (Module 8)" };
        if (controllerName.Equals("SalesPayments", StringComparison.OrdinalIgnoreCase)) return new[] { "08. Sales - Payments & Receivables (Module 8)" };

        // 09. Purchases & Inward Deliveries
        if (controllerName.Equals("Purchases", StringComparison.OrdinalIgnoreCase)) return new[] { "09. Purchases - Purchase Orders & Inward Deliveries (Module 9)" };

        // 10. Labour Management
        if (controllerName.StartsWith("Labour", StringComparison.OrdinalIgnoreCase)) return new[] { "10. Labour - Workers, Attendance & Daily Wages (Module 10)" };

        // 11. Finance, Bank Accounts & Reports (Module 11)
        if (controllerName.Equals("BankAccounts", StringComparison.OrdinalIgnoreCase) ||
            controllerName.Equals("Reports", StringComparison.OrdinalIgnoreCase))
        {
            return new[] { "11. Finance, Bank Accounts & Reports (Module 11)" };
        }

        // 13. Machinery & Equipment (Module 13)
        if (ns.Contains("Agriman.Machinery") || controllerName.Equals("Machinery", StringComparison.OrdinalIgnoreCase) || controllerName.Equals("MachineryExpenses", StringComparison.OrdinalIgnoreCase))
        {
            return new[] { "13. Machinery & Equipment (Module 13)" };
        }

        // 14. Loan & Finance (Module 14)
        if (controllerName.Equals("Loan", StringComparison.OrdinalIgnoreCase) || controllerName.Equals("Loans", StringComparison.OrdinalIgnoreCase))
        {
            return new[] { "14. Loan & Finance (Module 14)" };
        }

        // 15. Supplier Management (Module 15)
        if (controllerName.Equals("Suppliers", StringComparison.OrdinalIgnoreCase) ||
            controllerName.Equals("SupplierTransactions", StringComparison.OrdinalIgnoreCase) ||
            controllerName.Equals("SupplierPayments", StringComparison.OrdinalIgnoreCase))
        {
            return new[] { "15. Supplier Management (Module 15)" };
        }

        // 16. Buyer & Customer Management (Module 16)
        if (controllerName.Equals("Buyers", StringComparison.OrdinalIgnoreCase)) return new[] { "16. Buyers - Customers, Wholesalers & Traders (Module 16)" };

        // 17. Payment & Receipt Management (Module 17)
        if (controllerName.Equals("FinancePayments", StringComparison.OrdinalIgnoreCase)) return new[] { "17. Payment & Receipt Management - Payments (Module 17)" };
        if (controllerName.Equals("FinanceReceipts", StringComparison.OrdinalIgnoreCase)) return new[] { "17. Payment & Receipt Management - Receipts (Module 17)" };

        return new[] { controllerName };
    });

    // JWT Bearer Auth in Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Paste your JWT bearer token directly (without 'Bearer '). Swagger will include it in the Authorization header.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });

    c.DocumentFilter<NgrokServerDocumentFilter>();
    c.OperationFilter<NgrokHeaderOperationFilter>();

    // XML comments documentation if available
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

var app = builder.Build();

// -----------------------------------------------------------------------------
// 7. AUTO DATABASE READINESS & SEED DATA INITIALIZATION INTO [Farmersdb]
// -----------------------------------------------------------------------------
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();

    // 1. Auth & User Database Tables -> Farmersdb
    try
    {
        var authDb = services.GetRequiredService<ApplicationDbContext>();
        await AgriMan.Api.Data.DbInitializer.InitializeAsync(authDb);
        logger.LogInformation("[Farmersdb] 1. Auth & Users module ready.");
    }
    catch (Exception ex)
    {
        logger.LogWarning("[Farmersdb] 1. Auth & Users notice: " + ex.Message);
    }

    // 2. Farm Management Database Tables -> agriman_db
    var farmDb = services.GetRequiredService<FarmDbContext>();
    try
    {
        await FarmManagementApi.Data.DbInitializer.InitializeAsync(farmDb, logger);
        logger.LogInformation("[agriman_db] 2a. Farm Management & Inventory Master ready.");
    }
    catch (Exception ex)
    {
        logger.LogWarning("[agriman_db] 2a. Farm Management notice: " + ex.Message);
    }

    try
    {
        farmDb.ChangeTracker.Clear();
        await FarmManagementApi.Data.FarmDbContext.EnsureLoanTablesCreatedAsync(farmDb);
        logger.LogInformation("[agriman_db] 2b. Loans, Bank Accounts & Module 17 (Payments & Receipts) ready.");
    }
    catch (Exception ex)
    {
        logger.LogWarning("[agriman_db] 2b. Loans & Finance tables notice: " + ex.Message);
    }

    try
    {
        farmDb.ChangeTracker.Clear();
        await FarmManagementApi.Data.FarmDbContext.EnsurePaymentReceiptSchemaAsync(farmDb);
        logger.LogInformation("[agriman_db] 2c. Module 17 (Payment & Receipt Management) verified.");
    }
    catch (Exception ex)
    {
        logger.LogWarning("[agriman_db] 2c. Module 17 notice: " + ex.Message);
    }

    // 3. Expenses Database Tables -> Farmersdb
    try
    {
        var expenseDb = services.GetRequiredService<ExpenseDbContext>();
        logger.LogInformation("[Farmersdb] 3. Expenses module ready.");
    }
    catch (Exception ex)
    {
        logger.LogWarning("[Farmersdb] 3. Expenses notice: " + ex.Message);
    }

    // 4. Sales Database Tables (Module 10: Buyers, Sales, SalesItems, SalesPayments) -> agriman_db
    try
    {
        var salesDb = services.GetRequiredService<SalesDbContext>();
        await SalesDbInitializer.InitializeAsync(salesDb, logger);
        logger.LogInformation("[agriman_db] 4. Sales module ready (Buyers, Sales, SalesItems, SalesPayments).");
    }
    catch (Exception ex)
    {
        logger.LogWarning("[agriman_db] 4. Sales notice: " + ex.Message);
    }

    // 5. Machinery & Operating Expenses Database Tables -> agriman_db
    try
    {
        var machineryDb = services.GetRequiredService<MachineryDbContext>();
        logger.LogInformation("[agriman_db] 5. Machinery & Operating Expenses module ready.");
    }
    catch (Exception ex)
    {
        logger.LogWarning("[agriman_db] 5. Machinery notice: " + ex.Message);
    }
}

// -----------------------------------------------------------------------------
// 8. MIDDLEWARE PIPELINE
// -----------------------------------------------------------------------------
app.UseForwardedHeaders();

app.UseCors("AllowAll");

// Cache-busting middleware for Swagger
app.Use(async (context, next) =>
{
    if (context.Request.Path.Value?.Contains("swagger", StringComparison.OrdinalIgnoreCase) == true)
    {
        context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        context.Response.Headers["Pragma"] = "no-cache";
        context.Response.Headers["Expires"] = "0";
    }
    await next();
});

// Serve uploaded static files & sales UI
app.UseDefaultFiles();
app.UseStaticFiles();

// Enable Swagger and Swagger UI with ordered views
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "ðŸŒ¾ [SHOW ALL] All 15+ Modules (Unified Platform)");
    c.SwaggerEndpoint("/swagger/auth/swagger.json", "01. Auth & User Management (Module 1)");
    c.SwaggerEndpoint("/swagger/farmers/swagger.json", "02. Farmers Registry & Profiles (Module 2)");
    c.SwaggerEndpoint("/swagger/farms/swagger.json", "03. Farms & Land Holdings (Module 3)");
    c.SwaggerEndpoint("/swagger/income/swagger.json", "04. Income Management (Module 4)");
    c.SwaggerEndpoint("/swagger/crops/swagger.json", "05. Crop & Season Management (Module 5)");
    c.SwaggerEndpoint("/swagger/inventory/swagger.json", "06. Inventory & Products (Module 6)");
    c.SwaggerEndpoint("/swagger/expenses/swagger.json", "07. Expenses API (Module 7)");
    c.SwaggerEndpoint("/swagger/sales/swagger.json", "08. Sales & Produce Receipts (Module 8)");
    c.SwaggerEndpoint("/swagger/purchases/swagger.json", "09. Purchase Orders & Inward Deliveries (Module 9)");
    c.SwaggerEndpoint("/swagger/labour/swagger.json", "10. Labour & Wage Management (Module 10)");
    c.SwaggerEndpoint("/swagger/finance/swagger.json", "11. Finance, Bank Accounts & Reports (Module 11)");
    c.SwaggerEndpoint("/swagger/machinery/swagger.json", "13. Machinery & Equipment (Module 13)");
    c.SwaggerEndpoint("/swagger/loans/swagger.json", "14. Loan & Finance (Module 14)");
    c.SwaggerEndpoint("/swagger/suppliers/swagger.json", "15. Supplier Management (Module 15)");
    c.SwaggerEndpoint("/swagger/buyers/swagger.json", "16. Buyer & Customer Management (Module 16)");
    c.SwaggerEndpoint("/swagger/payments-receipts/swagger.json", "17. Payment & Receipt Management (Module 17)");

    c.RoutePrefix = "swagger";
    c.DocumentTitle = "AGRIMAN Unified Platform - All Modules (Farmersdb)";
    c.DefaultModelsExpandDepth(1);
    c.DisplayRequestDuration();
    c.EnableFilter();
    c.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.None);
    c.ConfigObject.AdditionalItems["tagsSorter"] = "alpha";
    c.ConfigObject.AdditionalItems["operationsSorter"] = "alpha";

    c.HeadContent = @"
        <script>
        (function() {
            const originalFetch = window.fetch;
            window.fetch = function(url, options = {}) {
                options.headers = options.headers || {};
                if (options.headers instanceof Headers) {
                    options.headers.append('ngrok-skip-browser-warning', 'true');
                } else if (Array.isArray(options.headers)) {
                    options.headers.push(['ngrok-skip-browser-warning', 'true']);
                } else {
                    options.headers['ngrok-skip-browser-warning'] = 'true';
                }
                return originalFetch(url, options);
            };
        })();
        </script>
    ";
});

// Root redirects & Health check
app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();
app.MapGet("/sales-ui", () => Results.Redirect("/index.html")).ExcludeFromDescription();
app.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    timestamp = DateTime.UtcNow,
    database = "Farmersdb",
    server = "NIRANJAN\\SQLEXPRESS",
    modules = new[]
    {
        "1. Auth & User API",
        "2. Farmers, Addresses & Bank API",
        "3. Farms & Land Holdings API",
        "4. Income Management API",
        "5. Purchases & Suppliers API",
        "6. Inventory & Products API",
        "7. Expenses API",
        "8. Sales API",
        "9. Machinery & Equipment API"
    },
    swagger = "/swagger",
    salesUi = "/index.html"
})).ExcludeFromDescription();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// -----------------------------------------------------------------------------
// 9. OPENAPI / NGROK DOCUMENT & OPERATION FILTERS
// -----------------------------------------------------------------------------
public class NgrokServerDocumentFilter : IDocumentFilter
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IConfiguration _configuration;

    public NgrokServerDocumentFilter(IHttpContextAccessor httpContextAccessor, IConfiguration configuration)
    {
        _httpContextAccessor = httpContextAccessor;
        _configuration = configuration;
    }

    public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
    {
        var servers = new List<OpenApiServer>();
        var httpContext = _httpContextAccessor.HttpContext;

        if (httpContext != null)
        {
            var req = httpContext.Request;
            var forwardedHost = req.Headers["X-Forwarded-Host"].FirstOrDefault();
            var forwardedProto = req.Headers["X-Forwarded-Proto"].FirstOrDefault();

            if (!string.IsNullOrEmpty(forwardedHost))
            {
                var proto = string.IsNullOrEmpty(forwardedProto) ? "https" : forwardedProto;
                servers.Add(new OpenApiServer
                {
                    Url = $"{proto}://{forwardedHost}",
                    Description = "ðŸŒ Active ngrok Public Tunnel Endpoint"
                });
            }
            else if (req.Host.HasValue)
            {
                servers.Add(new OpenApiServer
                {
                    Url = $"{req.Scheme}://{req.Host.Value}",
                    Description = "ðŸ  Current Host Server"
                });
            }
        }

        var configNgrokUrl = _configuration["Ngrok:PublicUrl"];
        if (!string.IsNullOrWhiteSpace(configNgrokUrl))
        {
            servers.Add(new OpenApiServer
            {
                Url = configNgrokUrl.TrimEnd('/'),
                Description = "ðŸ”— Configured ngrok Tunnel URL"
            });
        }

        servers.Add(new OpenApiServer
        {
            Url = "http://localhost:5200",
            Description = "ðŸ’» Localhost (Port 5200)"
        });

        swaggerDoc.Servers = servers;
    }
}

public class NgrokHeaderOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        operation.Parameters ??= new List<OpenApiParameter>();
        operation.Parameters.Add(new OpenApiParameter
        {
            Name = "ngrok-skip-browser-warning",
            In = ParameterLocation.Header,
            Required = false,
            Description = "Skip ngrok browser warning interstitial (default: true)",
            Schema = new OpenApiSchema
            {
                Type = "string",
                Default = new Microsoft.OpenApi.Any.OpenApiString("true")
            }
        });
    }
}
