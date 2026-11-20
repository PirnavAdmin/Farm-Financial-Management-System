using SalesApi.DTOs;

namespace SalesApi.Services;

public class ServiceResult<T>
{
    public bool Success { get; init; }
    public int StatusCode { get; init; } = 200;
    public string? ErrorMessage { get; init; }
    public T? Data { get; init; }

    public static ServiceResult<T> Ok(T data, int statusCode = 200) =>
        new() { Success = true, StatusCode = statusCode, Data = data };

    public static ServiceResult<T> Fail(string message, int statusCode = 400) =>
        new() { Success = false, StatusCode = statusCode, ErrorMessage = message };
}

public interface ISalesService
{
    // Sales
    Task<PagedResult<SaleResponseDto>> GetSalesAsync(SaleQueryParameters query);
    Task<SaleResponseDto?> GetSaleByIdAsync(int id);
    Task<SaleResponseDto?> GetSaleByNoAsync(string salesNo);
    Task<SaleSummaryDto> GetSalesSummaryAsync();
    Task<SalesAnalyticsDto> GetSalesAnalyticsAsync(DateTime? fromDate = null, DateTime? toDate = null);
    Task<ServiceResult<SaleResponseDto>> CreateSaleAsync(CreateSaleDto dto);
    Task<ServiceResult<SaleResponseDto>> UpdateSaleAsync(int id, UpdateSaleDto dto);
    Task<ServiceResult<SaleResponseDto>> UpdateSaleStatusAsync(int id, string paymentStatus);
    Task<ServiceResult<bool>> DeleteSaleAsync(int id);
    Task<string> ExportSalesCsvAsync(SaleQueryParameters query);

    // Sales Items
    Task<ServiceResult<List<SalesItemDto>>> GetSaleItemsAsync(int saleId);
    Task<ServiceResult<SaleResponseDto>> AddSaleItemAsync(int saleId, CreateSalesItemDto dto);
    Task<ServiceResult<SaleResponseDto>> UpdateSaleItemAsync(int saleId, int itemId, UpdateSalesItemDto dto);
    Task<ServiceResult<SaleResponseDto>> DeleteSaleItemAsync(int saleId, int itemId);

    // Sales Payments & Receivables
    Task<List<SalesPaymentResponseDto>> GetPaymentsAsync(string? search, string? buyer, string? salesNo, string? paymentMode, DateTime? fromDate, DateTime? toDate);
    Task<SalesPaymentResponseDto?> GetPaymentByIdAsync(int id);
    Task<SalesPaymentSummaryDto> GetPaymentsSummaryAsync();
    Task<ServiceResult<SalesPaymentResponseDto>> CreatePaymentAsync(CreateSalesPaymentDto dto);
    Task<ServiceResult<SalesPaymentResponseDto>> UpdatePaymentAsync(int id, UpdateSalesPaymentDto dto);
    Task<ServiceResult<bool>> DeletePaymentAsync(int id);
    Task<ReceivablesOverviewDto> GetReceivablesAsync(string? search = null, string? buyer = null, string? status = null);
    Task<ServiceResult<ReceivableItemDto>> SyncReceivableAsync(string salesNo, SyncReceivableDto dto);

    // Buyers / Customers
    Task<List<BuyerResponseDto>> GetBuyersAsync(string? search, string? status);
    Task<BuyerResponseDto?> GetBuyerByIdAsync(int id);
    Task<BuyerSummaryDto> GetBuyersSummaryAsync();
    Task<BuyerLedgerDto?> GetBuyerLedgerAsync(int id);
    Task<ServiceResult<BuyerResponseDto>> CreateBuyerAsync(CreateBuyerDto dto);
    Task<ServiceResult<BuyerResponseDto>> UpdateBuyerAsync(int id, UpdateBuyerDto dto);
    Task<ServiceResult<BuyerResponseDto>> UpdateBuyerStatusAsync(int id, string status);
    Task<ServiceResult<bool>> DeleteBuyerAsync(int id);
}
