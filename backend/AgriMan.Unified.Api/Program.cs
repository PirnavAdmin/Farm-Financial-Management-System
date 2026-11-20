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
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

var builder = WebApplication.CreateBuilder(args);

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
    ?? "Server=localhost;Port=3306;Database=agriman_db;User=root;Password=Pilli@1995;CharSet=utf8mb4;";

var mySqlServerVersion = new MySqlServerVersion(new Version(8, 0, 46));

// API 1: Auth & User Management DbContext -> agriman_db
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(mySqlConnectionString, mySqlServerVersion, sqlOptions =>
    {
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
        Description = "### 🌾 Comprehensive Unified Farm Financial & Operations Platform API\n" +
                      "Unified ASP.NET Core (.NET 8) platform storing all data in **`Farmersdb`** on `NIRANJAN\\SQLEXPRESS`:\n\n" +
                      "- **1. Auth & User API**: JWT Login, Registration, OTP Password Reset, Roles, Permissions\n" +
                      "- **2. Farmer Registry**: Profiles, Aadhaar, Land Holding, Addresses, Bank Accounts\n" +
                      "- **3. Farm Management**: Farms, Land Details, Survey Numbers, Soil Types, Irrigation, Documents\n" +
                      "- **4. Income Management**: Categories, Transactions, Items, Payment Receipts\n" +
                      "- **5. Purchases & Suppliers**: Vendor Profiles, Purchase Orders, Line Items, Disbursements\n" +
                      "- **6. Inventory & Products**: Agricultural Inputs, Stock In/Out, Stock Adjustments\n" +
                      "- **7. Expenses API**: Financial Ledger, Categories, Expense Items, Disbursements, CSV Export\n" +
                      "- **8. Sales API**: Crop Sales Records, Analytics Summary, Auto Calculations, Seed Data\n" +
                      "- **9. Machinery & Equipment API**: Farm Machinery Fleet, Lookups, Summary & Operating Expenses\n" +
                      "- **0. Unified Overview**: Cross-module Total Data (`/api/total-data`) & System Health (`/api/health`)\n\n" +
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

    c.SwaggerDoc("purchases", new OpenApiInfo
    {
        Title = "5. Purchases & Suppliers API - Farmersdb",
        Version = "v1",
        Description = "Agricultural suppliers directory, purchase orders, line items, and payments in `Farmersdb`."
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

    c.SwaggerDoc("machinery", new OpenApiInfo
    {
        Title = "9. Machinery & Equipment API - Farmersdb",
        Version = "v1",
        Description = "Farm machinery fleet registry, lookups, summary analytics, and operating expenses in `Farmersdb`."
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
            return ns.Contains("AgriMan.Api") || name.StartsWith("Auth") || name.StartsWith("User") || name.StartsWith("Role") || name.StartsWith("Permission");
        }
        if (docName == "farmers")
        {
            return name.StartsWith("Farmer");
        }
        if (docName == "farms")
        {
            return name.StartsWith("Farm") || name.StartsWith("Master");
        }
        if (docName == "income")
        {
            return name.StartsWith("Income");
        }
        if (docName == "purchases")
        {
            return name.StartsWith("Purchase") || name.StartsWith("Supplier");
        }
        if (docName == "inventory")
        {
            return name.StartsWith("Inventory") || name.StartsWith("Product");
        }
        if (docName == "expenses")
        {
            return ns.Contains("AgriMan.Expenses") || name.StartsWith("Expense");
        }
        if (docName == "sales")
        {
            return ns.Contains("Sales") || name.StartsWith("Sale");
        }
        if (docName == "machinery")
        {
            return ns.Contains("Agriman.Machinery") || name.StartsWith("Machinery");
        }

        return false;
    });

    // Tag actions by category
    c.TagActionsBy(apiDesc =>
    {
        var descriptor = apiDesc.ActionDescriptor as ControllerActionDescriptor;
        var controllerName = descriptor?.ControllerName ?? "General";
        var ns = descriptor?.ControllerTypeInfo.Namespace ?? "";

        // 0. Unified Overview & Health
        if (controllerName.Equals("TotalData", StringComparison.OrdinalIgnoreCase))
        {
            return new[] { "0. Unified Overview - Total Data (Farmersdb)" };
        }
        if (controllerName.Equals("Health", StringComparison.OrdinalIgnoreCase))
        {
            return new[] { "0. Unified Overview - Health & Migrations" };
        }

        // 1. Auth & Users
        if (ns.Contains("AgriMan.Api") || controllerName.Equals("Auth", StringComparison.OrdinalIgnoreCase) || controllerName.Equals("Users", StringComparison.OrdinalIgnoreCase) || controllerName.Equals("Roles", StringComparison.OrdinalIgnoreCase))
        {
            if (controllerName.Equals("Auth", StringComparison.OrdinalIgnoreCase)) return new[] { "1. Auth - Authentication (Login / Register / OTP)" };
            if (controllerName.Equals("Users", StringComparison.OrdinalIgnoreCase)) return new[] { "1. Auth - User Administration & Stats" };
            if (controllerName.Equals("Roles", StringComparison.OrdinalIgnoreCase) || controllerName.Equals("Permissions", StringComparison.OrdinalIgnoreCase)) return new[] { "1. Auth - Roles & Permissions" };
            return new[] { "1. Auth & User API" };
        }

        // 2. Farmers, Address & Bank
        if (controllerName.Equals("Farmers", StringComparison.OrdinalIgnoreCase)) return new[] { "2. Farmers - Farmer Registry & Profiles" };
        if (controllerName.Equals("FarmerAddresses", StringComparison.OrdinalIgnoreCase)) return new[] { "2. Farmers - Farmer Addresses" };
        if (controllerName.Equals("FarmerBankAccounts", StringComparison.OrdinalIgnoreCase)) return new[] { "2. Farmers - Farmer Bank Accounts" };

        // 3. Farms & Land Management
        if (controllerName.Equals("Farms", StringComparison.OrdinalIgnoreCase)) return new[] { "3. Farms - Farm Profiles" };
        if (controllerName.Equals("FarmLandDetails", StringComparison.OrdinalIgnoreCase)) return new[] { "3. Farms - Land & Soil Details" };
        if (controllerName.Equals("FarmDocuments", StringComparison.OrdinalIgnoreCase)) return new[] { "3. Farms - Farm Documents Vault" };
        if (controllerName.Equals("Masters", StringComparison.OrdinalIgnoreCase)) return new[] { "3. Farms - Master Lookups (Soil & Irrigation)" };

        // 4. Income Management
        if (controllerName.Equals("Income", StringComparison.OrdinalIgnoreCase)) return new[] { "4. Income - Income Categories, Transactions & Payments" };

        // 5. Purchases & Suppliers
        if (controllerName.Equals("Suppliers", StringComparison.OrdinalIgnoreCase)) return new[] { "5. Purchases - Suppliers Directory" };
        if (controllerName.Equals("Purchases", StringComparison.OrdinalIgnoreCase)) return new[] { "5. Purchases - Purchase Orders & Payments" };

        // 6. Inventory & Agricultural Inputs
        if (controllerName.Equals("Products", StringComparison.OrdinalIgnoreCase)) return new[] { "6. Inventory - Products & Categories" };
        if (controllerName.Equals("Inventory", StringComparison.OrdinalIgnoreCase)) return new[] { "6. Inventory - Stock In, Stock Out & Adjustments" };

        // 7. Expenses API
        if (ns.Contains("AgriMan.Expenses") || controllerName.Equals("Expenses", StringComparison.OrdinalIgnoreCase) || controllerName.Equals("ExpenseCategories", StringComparison.OrdinalIgnoreCase))
        {
            if (controllerName.Equals("Expenses", StringComparison.OrdinalIgnoreCase)) return new[] { "7. Expenses - Financial Ledger & Vouchers" };
            if (controllerName.Equals("ExpenseCategories", StringComparison.OrdinalIgnoreCase)) return new[] { "7. Expenses - Overhead Categories" };
            return new[] { "7. Expenses API" };
        }

        // 8. Sales API
        if (ns.Contains("Sales") || controllerName.Equals("Sales", StringComparison.OrdinalIgnoreCase))
        {
            return new[] { "8. Sales - Crop Sales & Revenue" };
        }

        // 9. Machinery & Equipment API
        if (ns.Contains("Agriman.Machinery") || controllerName.Equals("Machinery", StringComparison.OrdinalIgnoreCase) || controllerName.Equals("MachineryExpenses", StringComparison.OrdinalIgnoreCase))
        {
            if (controllerName.Equals("Machinery", StringComparison.OrdinalIgnoreCase)) return new[] { "9. Machinery - Equipment & Fleet" };
            if (controllerName.Equals("MachineryExpenses", StringComparison.OrdinalIgnoreCase)) return new[] { "9. Machinery - Operating Expenses" };
            return new[] { "9. Machinery & Equipment API" };
        }

        // 10. Loans & Finance API
        if (controllerName.Equals("Loan", StringComparison.OrdinalIgnoreCase))
        {
            return new[] { "10. Finance - Loans & Liabilities API" };
        }

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

    // 2. Farm Management Database Tables -> Farmersdb
    try
    {
        var farmDb = services.GetRequiredService<FarmDbContext>();
        await FarmManagementApi.Data.DbInitializer.InitializeAsync(farmDb, logger);
        await FarmManagementApi.Data.FarmDbContext.EnsureLoanTablesCreatedAsync(farmDb);
        logger.LogInformation("[Farmersdb] 2. Farm Management module & Loans ready.");
    }
    catch (Exception ex)
    {
        logger.LogWarning("[Farmersdb] 2. Farm Management notice: " + ex.Message);
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

    // 4. Sales Database Tables -> Farmersdb
    try
    {
        var salesDb = services.GetRequiredService<SalesDbContext>();
        // Seed initial Sales records if empty in Farmersdb
        if (!await salesDb.Sales.AnyAsync())
        {
            var seedSales = new List<Sale>
            {
                new()
                {
                    SalesNo = "SAL-2026-001",
                    SalesDate = new DateTime(2026, 11, 1),
                    Buyer = "Green Agro Foods Ltd",
                    Farm = "Sunrise Valley Farm",
                    Crop = "Organic Tomatoes",
                    Quantity = 1500m,
                    Unit = "kg",
                    Rate = 35m,
                    GrossAmount = 52500m,
                    Commission = 1500m,
                    Transport = 2000m,
                    NetAmount = 49000m,
                    PaymentStatus = "Paid",
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    SalesNo = "SAL-2026-002",
                    SalesDate = new DateTime(2026, 11, 3),
                    Buyer = "Fresh Mart Wholesale",
                    Farm = "Green Hills Orchard",
                    Crop = "Potatoes",
                    Quantity = 800m,
                    Unit = "kg",
                    Rate = 20m,
                    GrossAmount = 16000m,
                    Commission = 500m,
                    Transport = 500m,
                    NetAmount = 15000m,
                    PaymentStatus = "Pending",
                    CreatedAt = DateTime.UtcNow
                }
            };
            salesDb.Sales.AddRange(seedSales);
            await salesDb.SaveChangesAsync();
            logger.LogInformation("[Farmersdb] Seeded initial sales records.");
        }

        logger.LogInformation("[Farmersdb] 4. Sales module ready.");
    }
    catch (Exception ex)
    {
        logger.LogWarning("[Farmersdb] 4. Sales notice: " + ex.Message);
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
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "🌾 All Modules (Unified Platform - Farmersdb)");
    c.SwaggerEndpoint("/swagger/auth/swagger.json", "1. Auth & User API Only");
    c.SwaggerEndpoint("/swagger/farmers/swagger.json", "2. Farmers, Addresses & Bank API Only");
    c.SwaggerEndpoint("/swagger/farms/swagger.json", "3. Farms & Land Holdings API Only");
    c.SwaggerEndpoint("/swagger/income/swagger.json", "4. Income Management API Only");
    c.SwaggerEndpoint("/swagger/purchases/swagger.json", "5. Purchases & Suppliers API Only");
    c.SwaggerEndpoint("/swagger/inventory/swagger.json", "6. Inventory & Products API Only");
    c.SwaggerEndpoint("/swagger/expenses/swagger.json", "7. Expenses API Only");
    c.SwaggerEndpoint("/swagger/sales/swagger.json", "8. Sales API Only");
    c.SwaggerEndpoint("/swagger/machinery/swagger.json", "9. Machinery & Equipment API Only");

    c.RoutePrefix = "swagger";
    c.DocumentTitle = "AGRIMAN Unified Platform - All Modules (Farmersdb)";
    c.DefaultModelsExpandDepth(1);
    c.DisplayRequestDuration();
    c.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.List);

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
                    Description = "🌐 Active ngrok Public Tunnel Endpoint"
                });
            }
            else if (req.Host.HasValue)
            {
                servers.Add(new OpenApiServer
                {
                    Url = $"{req.Scheme}://{req.Host.Value}",
                    Description = "🏠 Current Host Server"
                });
            }
        }

        var configNgrokUrl = _configuration["Ngrok:PublicUrl"];
        if (!string.IsNullOrWhiteSpace(configNgrokUrl))
        {
            servers.Add(new OpenApiServer
            {
                Url = configNgrokUrl.TrimEnd('/'),
                Description = "🔗 Configured ngrok Tunnel URL"
            });
        }

        servers.Add(new OpenApiServer
        {
            Url = "http://localhost:5200",
            Description = "💻 Localhost (Port 5200)"
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
