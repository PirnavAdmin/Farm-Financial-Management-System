using System.Text;
using System.Text.Json.Serialization;
using AgriMan.Api.Data;
using AgriMan.Api.Middleware;
using AgriMan.Api.Repositories;
using AgriMan.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Controllers with JSON formatting options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// 2. Configure SQL Server with Entity Framework Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=Niranjan\\SQLEXPRESS;Database=admindb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true;";

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// 3. Register Repositories & Application Services (Dependency Injection)
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRoleRepository, RoleRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<ICompanyService, CompanyService>();

// 4. Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "AGRIMAN_SUPER_SECRET_KEY_FOR_JWT_AUTHENTICATION_2026_FARM_SYSTEM_SETTINGS_USERS";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "AgriManAuth";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "AgriManApp";

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
        ClockSkew = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            string? authHeader = context.Request.Headers["Authorization"];
            if (!string.IsNullOrEmpty(authHeader))
            {
                if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    context.Token = authHeader.Substring("Bearer ".Length).Trim();
                }
                else
                {
                    context.Token = authHeader.Trim();
                }
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// 5. Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 6. Configure Swagger with Bearer Authentication
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "AGRIMAN Farm Management - Users & Settings API",
        Version = "v1",
        Description = "Backend APIs for Settings -> Users, Roles & Permissions, Company Settings, Audit Logs, and Authentication."
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT Bearer token."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Provide real, valid Gmail and credential examples in Swagger UI
    c.SchemaFilter<AgriMan.Api.Swagger.SwaggerExampleSchemaFilter>();

    // Include XML comments for comprehensive Swagger documentation
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

var app = builder.Build();

// 7. Global Exception Handling Middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

// 8. Auto-create database & seed sample records on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var passwordHasher = services.GetRequiredService<IPasswordHasher>();
        await DbInitializer.SeedAsync(context, passwordHasher);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

// 9. HTTP Pipeline configuration
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "AGRIMAN Users & Settings API v1");
    c.RoutePrefix = "swagger";
    c.DocumentTitle = "AGRIMAN Farm Management - Swagger UI";
    c.DisplayRequestDuration();
});

app.UseCors("AllowAll");

// Seamlessly forward /api/auth and /api/users requests to /api/v1/... without duplicate Swagger routes
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value;
    if (!string.IsNullOrEmpty(path))
    {
        if (path.StartsWith("/api/auth", StringComparison.OrdinalIgnoreCase) && !path.StartsWith("/api/v1/auth", StringComparison.OrdinalIgnoreCase))
        {
            context.Request.Path = "/api/v1" + path.Substring(4);
        }
        else if (path.StartsWith("/api/users", StringComparison.OrdinalIgnoreCase) && !path.StartsWith("/api/v1/users", StringComparison.OrdinalIgnoreCase))
        {
            context.Request.Path = "/api/v1" + path.Substring(4);
        }
    }
    await next();
});

// Static files for user management admin dashboard
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
