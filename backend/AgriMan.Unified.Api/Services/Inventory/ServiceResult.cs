namespace FarmManagementApi.Services;

public class ServiceResult<T>
{
    public bool Success { get; init; }
    public int StatusCode { get; init; } = 200;
    public string? Message { get; init; }
    public string? ErrorMessage { get; init; }
    public List<string> Errors { get; init; } = new();
    public T? Data { get; init; }

    public static ServiceResult<T> Ok(T data, string? message = null, int statusCode = 200) =>
        new() { Success = true, StatusCode = statusCode, Data = data, Message = message };

    public static ServiceResult<T> Created(T data, string? message = null) =>
        new() { Success = true, StatusCode = 201, Data = data, Message = message };

    public static ServiceResult<T> Fail(string message, int statusCode = 400, List<string>? errors = null) =>
        new() { Success = false, StatusCode = statusCode, Message = message, ErrorMessage = message, Errors = errors ?? new() };

    public static ServiceResult<T> NotFound(string message = "Resource not found.") =>
        new() { Success = false, StatusCode = 404, Message = message, ErrorMessage = message };
}
