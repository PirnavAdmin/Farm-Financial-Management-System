using System.Net;
using System.Text.Json;

namespace AgriMan.Api.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;

        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception occurred during request {Path}", context.Request.Path);
                await HandleExceptionAsync(context, ex);
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var statusCode = exception switch
            {
                KeyNotFoundException => HttpStatusCode.NotFound,
                InvalidOperationException => HttpStatusCode.BadRequest,
                UnauthorizedAccessException => HttpStatusCode.Unauthorized,
                ArgumentException => HttpStatusCode.BadRequest,
                Microsoft.EntityFrameworkCore.DbUpdateException => HttpStatusCode.BadRequest,
                _ => HttpStatusCode.InternalServerError
            };

            context.Response.StatusCode = (int)statusCode;

            var errorMessage = exception.Message;
            if (exception is Microsoft.EntityFrameworkCore.DbUpdateException dbEx)
            {
                var innerMsg = dbEx.InnerException?.Message ?? string.Empty;
                if (innerMsg.Contains("duplicate key", StringComparison.OrdinalIgnoreCase) || 
                    innerMsg.Contains("IX_", StringComparison.OrdinalIgnoreCase))
                {
                    errorMessage = "A record with this email or unique identifier already exists.";
                }
                else
                {
                    errorMessage = "A database constraint conflict occurred while saving changes.";
                }
            }

            var response = new
            {
                statusCode = context.Response.StatusCode,
                message = errorMessage,
                details = statusCode == HttpStatusCode.InternalServerError 
                    ? "An error occurred while processing your request. Please try again later." 
                    : null
            };

            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
        }
    }
}
