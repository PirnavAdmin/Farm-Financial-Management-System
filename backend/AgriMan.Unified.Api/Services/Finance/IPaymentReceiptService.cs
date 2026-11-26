using System.Security.Claims;
using FarmManagementApi.DTOs;

namespace FarmManagementApi.Services
{
    public interface IPaymentReceiptService
    {
        // ── Payments (Outflows) ──────────────────────────────────────────────
        Task<List<FinancePaymentResponseDto>> GetPaymentsAsync(PaymentQueryParameters parameters);
        Task<FinancePaymentResponseDto?> GetPaymentByIdAsync(int id);
        Task<string> GetNextPaymentNoAsync();
        Task<PaymentSummaryDto> GetPaymentSummaryAsync(PaymentQueryParameters parameters);
        Task<FinanceServiceResult<PaymentVoucherDto>> GetPaymentVoucherAsync(int id);
        Task<AnalyticsReportResponseDto<FinancePaymentResponseDto>> GetPaymentReportAsync(string reportType, PaymentQueryParameters parameters);
        Task<string> ExportPaymentsCsvAsync(PaymentQueryParameters parameters);
        Task<FinanceServiceResult<FinancePaymentResponseDto>> CreatePaymentAsync(CreateFinancePaymentDto dto, ClaimsPrincipal? actor, string? ipAddress);
        Task<FinanceServiceResult<FinancePaymentResponseDto>> UpdatePaymentAsync(int id, UpdateFinancePaymentDto dto, ClaimsPrincipal? actor, string? ipAddress);
        Task<FinanceServiceResult<FinancePaymentResponseDto>> UpdatePaymentStatusAsync(int id, UpdateTransactionStatusDto dto, ClaimsPrincipal? actor, string? ipAddress);
        Task<FinanceServiceResult<FinancePaymentResponseDto>> CancelPaymentAsync(int id, CancelTransactionDto? dto, ClaimsPrincipal? actor, string? ipAddress);
        Task<FinanceServiceResult<bool>> DeletePaymentAsync(int id, ClaimsPrincipal? actor, string? ipAddress);

        // ── Receipts (Inflows) ───────────────────────────────────────────────
        Task<List<FinanceReceiptResponseDto>> GetReceiptsAsync(ReceiptQueryParameters parameters);
        Task<FinanceReceiptResponseDto?> GetReceiptByIdAsync(int id);
        Task<string> GetNextReceiptNoAsync();
        Task<ReceiptSummaryDto> GetReceiptSummaryAsync(ReceiptQueryParameters parameters);
        Task<FinanceServiceResult<ReceiptVoucherDto>> GetReceiptVoucherAsync(int id);
        Task<AnalyticsReportResponseDto<FinanceReceiptResponseDto>> GetReceiptReportAsync(string reportType, ReceiptQueryParameters parameters);
        Task<string> ExportReceiptsCsvAsync(ReceiptQueryParameters parameters);
        Task<FinanceServiceResult<FinanceReceiptResponseDto>> CreateReceiptAsync(CreateFinanceReceiptDto dto, ClaimsPrincipal? actor, string? ipAddress);
        Task<FinanceServiceResult<FinanceReceiptResponseDto>> UpdateReceiptAsync(int id, UpdateFinanceReceiptDto dto, ClaimsPrincipal? actor, string? ipAddress);
        Task<FinanceServiceResult<FinanceReceiptResponseDto>> UpdateReceiptStatusAsync(int id, UpdateTransactionStatusDto dto, ClaimsPrincipal? actor, string? ipAddress);
        Task<FinanceServiceResult<FinanceReceiptResponseDto>> CancelReceiptAsync(int id, CancelTransactionDto? dto, ClaimsPrincipal? actor, string? ipAddress);
        Task<FinanceServiceResult<bool>> DeleteReceiptAsync(int id, ClaimsPrincipal? actor, string? ipAddress);
    }
}
