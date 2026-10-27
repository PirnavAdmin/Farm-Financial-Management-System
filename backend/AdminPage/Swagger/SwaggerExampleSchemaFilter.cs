using AgriMan.Api.DTOs;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace AgriMan.Api.Swagger
{
    public class SwaggerExampleSchemaFilter : ISchemaFilter
    {
        public void Apply(OpenApiSchema schema, SchemaFilterContext context)
        {
            if (context.Type == typeof(LoginRequestDto))
            {
                schema.Example = new OpenApiObject
                {
                    ["email"] = new OpenApiString("admin@gmail.com"),
                    ["password"] = new OpenApiString("AgriMan@2026"),
                    ["rememberMe"] = new OpenApiBoolean(true)
                };
            }
            else if (context.Type == typeof(RegisterRequestDto))
            {
                schema.Example = new OpenApiObject
                {
                    ["fullName"] = new OpenApiString("Arjun Mehta"),
                    ["email"] = new OpenApiString("arjun@gmail.com"),
                    ["phoneNumber"] = new OpenApiString("+91 98765 43210"),
                    ["password"] = new OpenApiString("AgriMan@2026"),
                    ["role"] = new OpenApiString("Administrator")
                };
            }
            else if (context.Type == typeof(ForgotPasswordRequestDto))
            {
                schema.Example = new OpenApiObject
                {
                    ["email"] = new OpenApiString("admin@gmail.com")
                };
            }
            else if (context.Type == typeof(ResetPasswordRequestDto))
            {
                schema.Example = new OpenApiObject
                {
                    ["email"] = new OpenApiString("admin@gmail.com"),
                    ["token"] = new OpenApiString("123456"),
                    ["newPassword"] = new OpenApiString("AgriMan@2026"),
                    ["confirmPassword"] = new OpenApiString("AgriMan@2026")
                };
            }
            else if (context.Type == typeof(CreateUserRequest))
            {
                schema.Example = new OpenApiObject
                {
                    ["name"] = new OpenApiString("Priya Sharma"),
                    ["email"] = new OpenApiString("priya@gmail.com"),
                    ["mobileNumber"] = new OpenApiString("+91 98765 12340"),
                    ["password"] = new OpenApiString("AgriMan@2026"),
                    ["roles"] = new OpenApiArray { new OpenApiString("Manager") },
                    ["isActive"] = new OpenApiBoolean(true)
                };
            }
            else if (context.Type == typeof(UpdateUserRequest))
            {
                schema.Example = new OpenApiObject
                {
                    ["name"] = new OpenApiString("Priya Sharma"),
                    ["email"] = new OpenApiString("priya@gmail.com"),
                    ["mobileNumber"] = new OpenApiString("+91 98765 12340"),
                    ["roles"] = new OpenApiArray { new OpenApiString("Manager") },
                    ["isActive"] = new OpenApiBoolean(true)
                };
            }
            else if (context.Type == typeof(CreateRoleRequest))
            {
                schema.Example = new OpenApiObject
                {
                    ["name"] = new OpenApiString("Field Supervisor"),
                    ["description"] = new OpenApiString("Monitors field laborers, machinery, and daily harvest logs"),
                    ["permissionIds"] = new OpenApiArray
                    {
                        new OpenApiInteger(12), // agriculture.view
                        new OpenApiInteger(13), // agriculture.manage
                        new OpenApiInteger(16)  // inventory.view
                    }
                };
            }
            else if (context.Type == typeof(UpdateRoleRequest))
            {
                schema.Example = new OpenApiObject
                {
                    ["name"] = new OpenApiString("Senior Field Supervisor"),
                    ["description"] = new OpenApiString("Oversees regional field teams and equipment logistics")
                };
            }
            else if (context.Type == typeof(AssignPermissionsRequest))
            {
                schema.Example = new OpenApiObject
                {
                    ["permissionIds"] = new OpenApiArray
                    {
                        new OpenApiInteger(12),
                        new OpenApiInteger(13),
                        new OpenApiInteger(16)
                    }
                };
            }
            else if (context.Type == typeof(RefreshTokenRequestDto))
            {
                schema.Example = new OpenApiObject
                {
                    ["refreshToken"] = new OpenApiString("sample-refresh-token-here")
                };
            }
            else if (context.Type == typeof(AssignRolesRequest))
            {
                schema.Example = new OpenApiObject
                {
                    ["roles"] = new OpenApiArray { new OpenApiString("Administrator"), new OpenApiString("Manager") }
                };
            }
            else if (context.Type == typeof(UpdateUserStatusRequest))
            {
                schema.Example = new OpenApiObject
                {
                    ["isActive"] = new OpenApiBoolean(true)
                };
            }
        }
    }
}
