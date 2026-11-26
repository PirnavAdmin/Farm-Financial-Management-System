using System.ComponentModel.DataAnnotations;

namespace FarmManagementApi.DTOs
{
    // ──────────────────────────────────────────────────────────────────────────
    // Shared Service Result & Common DTOs
    // ──────────────────────────────────────────────────────────────────────────

    public class FinanceServiceResult<T>
    {
        public bool Success { get; set; }
        public int StatusCode { get; set; } = 200;
        public string? ErrorMessage { get; set; }
        public T? Data { get; set; }

        public static FinanceServiceResult<T> Ok(T data, int statusCode = 200) =>
            new() { Success = true, StatusCode = statusCode, Data = data };

        public static FinanceServiceResult<T> Fail(string message, int statusCode = 400) =>
            new() { Success = false, StatusCode = statusCode, ErrorMessage = message };
    }

    public class UpdateTransactionStatusDto
    {
        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "Completed";

        [MaxLength(300)]
        public string? Reason { get; set; }
    }

    public class CancelTransactionDto
    {
        [MaxLength(300)]
        public string? Reason { get; set; }
    }

    public class NextNumberDto
    {
        public string NextNumber { get; set; } = string.Empty;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Payment DTOs (Module 17 — Outflows)
    // ──────────────────────────────────────────────────────────────────────────

    public class PaymentQueryParameters
    {
        public string? Search { get; set; }
        public string? Status { get; set; }
        public string? Purpose { get; set; }
        public string? PaymentType { get; set; }
        public string? PayeeType { get; set; }
        public string? PaymentMode { get; set; }
        public string? Farm { get; set; }
        public string? Crop { get; set; }
        public string? Season { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? ToDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? SortBy { get; set; }
        public bool SortDescending { get; set; } = true;
        public int? Page { get; set; }
        public int? PageSize { get; set; }
    }

    public class CreateFinancePaymentDto
    {
        [MaxLength(50)]
        public string? PaymentNo { get; set; }

        public DateTime? PaymentDate { get; set; }
        public DateTime? Date { get; set; }

        [MaxLength(150)]
        public string? Purpose { get; set; }

        [MaxLength(100)]
        public string? PaymentType { get; set; }

        [MaxLength(120)]
        public string? Category { get; set; }

        [MaxLength(100)]
        public string? PayeeType { get; set; }

        [MaxLength(150)]
        public string? PayeeName { get; set; }

        [MaxLength(150)]
        public string? Party { get; set; }

        [MaxLength(100)]
        public string? ContactInfo { get; set; }

        [MaxLength(150)]
        public string? Farm { get; set; }

        [MaxLength(120)]
        public string? FieldParcel { get; set; }

        [MaxLength(120)]
        public string? Crop { get; set; }

        [MaxLength(100)]
        public string? Season { get; set; }

        [MaxLength(50)]
        public string? RefType { get; set; }

        [MaxLength(100)]
        public string? RefNo { get; set; }

        [MaxLength(100)]
        public string? ReferenceTransaction { get; set; }

        public decimal? OriginalAmount { get; set; }
        public decimal? OutstandingAmount { get; set; }

        public decimal Amount { get; set; }
        public decimal AdditionalCharges { get; set; } = 0;
        public decimal Discount { get; set; } = 0;

        [MaxLength(50)]
        public string? PaymentMode { get; set; }

        public int? BankAccountId { get; set; }

        [MaxLength(150)]
        public string? BankAccount { get; set; }

        [MaxLength(100)]
        public string? TransactionRef { get; set; }

        [MaxLength(100)]
        public string? ReferenceNo { get; set; }

        [MaxLength(100)]
        public string? ChequeNo { get; set; }

        public DateTime? ChequeDate { get; set; }

        public long? SupplierId { get; set; }
        public int? LabourId { get; set; }

        [MaxLength(500)]
        public string? Remarks { get; set; }

        [MaxLength(30)]
        public string? Status { get; set; }
    }

    public class UpdateFinancePaymentDto : CreateFinancePaymentDto
    {
        public int? Id { get; set; }
    }

    public class FinancePaymentResponseDto
    {
        public int Id { get; set; }
        public string PaymentNo { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string PaymentDate { get; set; } = string.Empty;
        public string PaymentDateDisplay { get; set; } = string.Empty;
        public string Purpose { get; set; } = string.Empty;
        public string PaymentType { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string PayeeType { get; set; } = string.Empty;
        public string PayeeName { get; set; } = string.Empty;
        public string Party { get; set; } = string.Empty;
        public string ContactInfo { get; set; } = string.Empty;
        public string Farm { get; set; } = string.Empty;
        public string FieldParcel { get; set; } = string.Empty;
        public string Crop { get; set; } = string.Empty;
        public string Season { get; set; } = string.Empty;
        public string RefType { get; set; } = "None";
        public string RefNo { get; set; } = string.Empty;
        public string? ReferenceTransaction { get; set; }
        public decimal OriginalAmount { get; set; }
        public decimal OutstandingAmount { get; set; }
        public decimal Amount { get; set; }
        public decimal AdditionalCharges { get; set; }
        public decimal Discount { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentMode { get; set; } = string.Empty;
        public int? BankAccountId { get; set; }
        public string BankAccount { get; set; } = string.Empty;
        public string TransactionRef { get; set; } = string.Empty;
        public string? ReferenceNo { get; set; }
        public string ChequeNo { get; set; } = string.Empty;
        public string ChequeDate { get; set; } = string.Empty;
        public long? SupplierId { get; set; }
        public int? LabourId { get; set; }
        public string Remarks { get; set; } = string.Empty;
        public string Status { get; set; } = "Completed";
        public string? CancellationReason { get; set; }
        public DateTime? CancelledAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class PaymentSummaryDto
    {
        public int TotalRecords { get; set; }
        public decimal TotalPayments { get; set; }
        public decimal SuccessfulAmount { get; set; }
        public decimal PendingAmount { get; set; }
        public decimal ThisMonthAmount { get; set; }
        public int CompletedCount { get; set; }
        public int PendingCount { get; set; }
        public int ProcessingCount { get; set; }
        public int FailedCount { get; set; }
        public int CancelledCount { get; set; }
        public decimal CancelledAmount { get; set; }
    }

    public class PaymentVoucherDto
    {
        public string VoucherTitle { get; set; } = "PAYMENT VOUCHER";
        public FinancePaymentResponseDto Payment { get; set; } = new();
        public string AmountInWords { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Receipt DTOs (Module 17 — Inflows)
    // ──────────────────────────────────────────────────────────────────────────

    public class ReceiptQueryParameters
    {
        public string? Search { get; set; }
        public string? Status { get; set; }
        public string? Purpose { get; set; }
        public string? PayerType { get; set; }
        public string? CollectionMode { get; set; }
        public string? PaymentMode { get; set; }
        public string? Farm { get; set; }
        public string? Crop { get; set; }
        public string? Season { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? ToDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? SortBy { get; set; }
        public bool SortDescending { get; set; } = true;
        public int? Page { get; set; }
        public int? PageSize { get; set; }
    }

    public class CreateFinanceReceiptDto
    {
        [MaxLength(50)]
        public string? ReceiptNo { get; set; }

        public DateTime? ReceiptDate { get; set; }
        public DateTime? Date { get; set; }

        [MaxLength(150)]
        public string? Purpose { get; set; }

        [MaxLength(120)]
        public string? Category { get; set; }

        [MaxLength(100)]
        public string? PayerType { get; set; }

        [MaxLength(150)]
        public string? PayerName { get; set; }

        [MaxLength(150)]
        public string? From { get; set; }

        [MaxLength(100)]
        public string? ContactInfo { get; set; }

        [MaxLength(150)]
        public string? Farm { get; set; }

        [MaxLength(120)]
        public string? FieldParcel { get; set; }

        [MaxLength(120)]
        public string? Crop { get; set; }

        [MaxLength(100)]
        public string? Season { get; set; }

        [MaxLength(50)]
        public string? RefType { get; set; }

        [MaxLength(100)]
        public string? RefNo { get; set; }

        [MaxLength(100)]
        public string? Reference { get; set; }

        public decimal? OriginalAmount { get; set; }
        public decimal? OutstandingAmount { get; set; }

        public decimal Amount { get; set; }
        public decimal Discount { get; set; } = 0;
        public decimal OtherCharges { get; set; } = 0;

        [MaxLength(50)]
        public string? CollectionMode { get; set; }

        [MaxLength(50)]
        public string? PaymentMode { get; set; }

        public int? BankAccountId { get; set; }

        [MaxLength(150)]
        public string? BankAccount { get; set; }

        [MaxLength(100)]
        public string? TransactionRef { get; set; }

        [MaxLength(100)]
        public string? ChequeNo { get; set; }

        public DateTime? ChequeDate { get; set; }

        public int? BuyerId { get; set; }
        public int? SaleId { get; set; }

        [MaxLength(500)]
        public string? Remarks { get; set; }

        [MaxLength(30)]
        public string? Status { get; set; }
    }

    public class UpdateFinanceReceiptDto : CreateFinanceReceiptDto
    {
        public int? Id { get; set; }
    }

    public class FinanceReceiptResponseDto
    {
        public int Id { get; set; }
        public string ReceiptNo { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string ReceiptDate { get; set; } = string.Empty;
        public string ReceiptDateDisplay { get; set; } = string.Empty;
        public string Purpose { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string PayerType { get; set; } = string.Empty;
        public string PayerName { get; set; } = string.Empty;
        public string From { get; set; } = string.Empty;
        public string ContactInfo { get; set; } = string.Empty;
        public string Farm { get; set; } = string.Empty;
        public string FieldParcel { get; set; } = string.Empty;
        public string Crop { get; set; } = string.Empty;
        public string Season { get; set; } = string.Empty;
        public string RefType { get; set; } = "None";
        public string RefNo { get; set; } = string.Empty;
        public string? Reference { get; set; }
        public decimal OriginalAmount { get; set; }
        public decimal OutstandingAmount { get; set; }
        public decimal Amount { get; set; }
        public decimal Discount { get; set; }
        public decimal OtherCharges { get; set; }
        public decimal FinalAmount { get; set; }
        public string CollectionMode { get; set; } = string.Empty;
        public string PaymentMode { get; set; } = string.Empty;
        public int? BankAccountId { get; set; }
        public string BankAccount { get; set; } = string.Empty;
        public string TransactionRef { get; set; } = string.Empty;
        public string ChequeNo { get; set; } = string.Empty;
        public string ChequeDate { get; set; } = string.Empty;
        public int? BuyerId { get; set; }
        public int? SaleId { get; set; }
        public string Remarks { get; set; } = string.Empty;
        public string Status { get; set; } = "Completed";
        public string? CancellationReason { get; set; }
        public DateTime? CancelledAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class ReceiptSummaryDto
    {
        public int TotalReceipts { get; set; }
        public decimal TotalReceived { get; set; }
        public decimal PendingReceivables { get; set; }
        public decimal ThisMonthAmount { get; set; }
        public int CompletedCount { get; set; }
        public int PendingCount { get; set; }
        public int ProcessingCount { get; set; }
        public int FailedCount { get; set; }
        public int CancelledCount { get; set; }
        public decimal CancelledAmount { get; set; }
    }

    public class ReceiptVoucherDto
    {
        public string VoucherTitle { get; set; } = "OFFICIAL RECEIPT";
        public FinanceReceiptResponseDto Receipt { get; set; } = new();
        public string AmountInWords { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Analytics / Reports DTOs
    // ──────────────────────────────────────────────────────────────────────────

    public class AnalyticsGroupRowDto
    {
        public string Label { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal CompletedAmount { get; set; }
        public decimal PendingAmount { get; set; }
        public decimal SharePercent { get; set; }
    }

    public class AnalyticsReportResponseDto<TItem>
    {
        public string ReportType { get; set; } = string.Empty;
        public string ReportTitle { get; set; } = string.Empty;
        public bool IsGrouped { get; set; }
        public int TotalCount { get; set; }
        public decimal GrandTotal { get; set; }
        public List<AnalyticsGroupRowDto> Groups { get; set; } = new();
        public List<TItem> Items { get; set; } = new();
    }
}
