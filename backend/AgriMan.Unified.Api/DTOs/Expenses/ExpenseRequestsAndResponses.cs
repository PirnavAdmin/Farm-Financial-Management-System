using System.ComponentModel.DataAnnotations;

namespace AgriMan.Expenses.Api.DTOs;

/// <summary>
/// Request model for adding a new farm expense (matches "Add Expenses record" modal UI).
/// </summary>
public class ExpenseCreateRequest
{
    /// <summary>
    /// Date of the expense transaction (e.g., 2026-10-22). If omitted, defaults to today.
    /// </summary>
    /// <example>2026-10-22</example>
    public DateTime? ExpenseDate { get; set; }

    /// <summary>
    /// Unique expense voucher number (e.g. EXP-2026-0098).
    /// If left empty, system automatically generates the next sequential number.
    /// </summary>
    /// <example>EXP-2026-0098</example>
    [MaxLength(50)]
    public string? ExpenseNo { get; set; }

    /// <summary>
    /// Name of the farmer incurring or managing the expense.
    /// </summary>
    /// <example>Arjun Mehta</example>
    [Required(ErrorMessage = "Farmer name is required")]
    [MaxLength(100)]
    public string Farmer { get; set; } = string.Empty;

    /// <summary>
    /// Farm or field parcel name where expenditure was utilized.
    /// </summary>
    /// <example>North Field</example>
    [Required(ErrorMessage = "Farm name is required")]
    [MaxLength(100)]
    public string Farm { get; set; } = string.Empty;

    /// <summary>
    /// Crop for which the expense was incurred.
    /// </summary>
    /// <example>Paddy</example>
    [Required(ErrorMessage = "Crop name is required")]
    [MaxLength(100)]
    public string Crop { get; set; } = string.Empty;

    /// <summary>
    /// Category of expense (e.g., Fertilizers, Labour, Seeds, Machinery, Pesticides).
    /// </summary>
    /// <example>Fertilizers</example>
    [Required(ErrorMessage = "Expense category is required")]
    [MaxLength(100)]
    public string ExpenseCategory { get; set; } = string.Empty;

    /// <summary>
    /// Optional foreign key to registered ExpenseCategory entity.
    /// </summary>
    public int? CategoryId { get; set; }

    /// <summary>
    /// Vendor, contractor, supplier, or labor provider name.
    /// </summary>
    /// <example>GreenGrow Supplies</example>
    [Required(ErrorMessage = "Supplier name is required")]
    [MaxLength(150)]
    public string Supplier { get; set; } = string.Empty;

    /// <summary>
    /// Detailed description or memo of items/services purchased.
    /// </summary>
    /// <example>Urea and potash</example>
    [Required(ErrorMessage = "Description is required")]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Total expenditure amount in INR (₹).
    /// </summary>
    /// <example>18500.00</example>
    [Required(ErrorMessage = "Amount is required")]
    [Range(0.01, 999999999.99, ErrorMessage = "Amount must be greater than zero")]
    public decimal Amount { get; set; }

    /// <summary>
    /// Mode of payment: Cash, Bank, UPI, Cheque, Card.
    /// </summary>
    /// <example>Bank</example>
    [MaxLength(50)]
    public string PaymentMode { get; set; } = "Cash";

    /// <summary>
    /// Payment reference or transaction ID (e.g. UTR-09133, cheque number, UPI ref).
    /// </summary>
    /// <example>UTR-09133</example>
    [MaxLength(100)]
    public string? ReferenceNo { get; set; }

    /// <summary>
    /// Additional notes, season stage, or internal remarks.
    /// </summary>
    /// <example>Season initial fertilizer application</example>
    [MaxLength(500)]
    public string? Remarks { get; set; }

    /// <summary>
    /// Expense payment status: Paid, Pending, Partially Paid. Defaults to "Paid".
    /// </summary>
    /// <example>Paid</example>
    [MaxLength(50)]
    public string? Status { get; set; } = "Paid";

    /// <summary>
    /// Optional line item breakdown for individual products/services in this expense.
    /// </summary>
    public List<ExpenseItemDto>? Items { get; set; }
}

/// <summary>
/// Request model for updating an existing expense transaction.
/// </summary>
public class ExpenseUpdateRequest
{
    [Required]
    public DateTime ExpenseDate { get; set; }

    [Required]
    [MaxLength(50)]
    public string ExpenseNo { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Farmer { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Farm { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Crop { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ExpenseCategory { get; set; } = string.Empty;

    public int? CategoryId { get; set; }

    [Required]
    [MaxLength(150)]
    public string Supplier { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [Range(0.01, 999999999.99)]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(50)]
    public string PaymentMode { get; set; } = "Cash";

    [MaxLength(100)]
    public string? ReferenceNo { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    [MaxLength(50)]
    public string Status { get; set; } = "Paid";

    public List<ExpenseItemDto>? Items { get; set; }
}

/// <summary>
/// Response item tailored for the Expenses table grid in the UI.
/// </summary>
public class ExpenseListItemResponse
{
    public int Id { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string FormattedDate { get; set; } = string.Empty;
    public string ExpenseNo { get; set; } = string.Empty;
    public string Farmer { get; set; } = string.Empty;
    public string Farm { get; set; } = string.Empty;
    public string Crop { get; set; } = string.Empty;
    public string ExpenseCategory { get; set; } = string.Empty;
    public string Supplier { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string FormattedAmount { get; set; } = string.Empty;
    public string PaymentMode { get; set; } = string.Empty;
    public string? ReferenceNo { get; set; }
    public string? Remarks { get; set; }
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// Full detail response model for an expense transaction including items and payments.
/// </summary>
public class ExpenseDetailResponse : ExpenseListItemResponse
{
    public int? CategoryId { get; set; }
    public string? ReceiptAttachmentUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<ExpenseItemDto> Items { get; set; } = new();
    public List<ExpensePaymentDto> Payments { get; set; } = new();
}

/// <summary>
/// DTO for child expense line-items (fertilizer bags, seed packets, labour count).
/// </summary>
public class ExpenseItemDto
{
    public int Id { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1;
    public string Unit { get; set; } = "unit";
    public decimal UnitPrice { get; set; } = 0;
    public decimal TotalAmount { get; set; } = 0;
    public string? Remarks { get; set; }
}

/// <summary>
/// DTO for child expense payment records.
/// </summary>
public class ExpensePaymentDto
{
    public int Id { get; set; }
    public DateTime PaymentDate { get; set; }
    public string PaymentMode { get; set; } = "Cash";
    public decimal Amount { get; set; }
    public string BankOrCash { get; set; } = "Cash";
    public string? ReferenceNo { get; set; }
    public string Status { get; set; } = "Completed";
    public string? Remarks { get; set; }
}

/// <summary>
/// Workspace summary metrics for the three top UI cards.
/// </summary>
public class ExpenseSummaryMetricsDto
{
    /// <summary>
    /// Total records in this workspace (Card 1).
    /// </summary>
    public int TotalRecords { get; set; }

    /// <summary>
    /// Total rows displayed on the current page (Card 2).
    /// </summary>
    public int RowsOnPage { get; set; }

    /// <summary>
    /// Total records matching active filter/search criteria (Card 3).
    /// </summary>
    public int MatchingFilters { get; set; }

    /// <summary>
    /// Total aggregated expense amount across the filtered records.
    /// </summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// Formatted total currency string (e.g. ₹26,900).
    /// </summary>
    public string FormattedTotalAmount { get; set; } = string.Empty;
}

/// <summary>
/// Generic paginated response wrapper containing dataset and UI header metrics.
/// </summary>
/// <typeparam name="T">Type of data items</typeparam>
public class PagedResult<T>
{
    public List<T> Data { get; set; } = new();
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public int TotalRecords { get; set; }
    public int TotalPages { get; set; }
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;
    public ExpenseSummaryMetricsDto Metrics { get; set; } = new();
}

/// <summary>
/// Query filter and pagination parameters for expenses list.
/// </summary>
public class ExpenseListQueryParameters
{
    /// <summary>
    /// General search term querying Expense No, Farmer, Farm, Crop, Supplier, Description, and Category.
    /// </summary>
    /// <example>Fertilizers</example>
    public string? Search { get; set; }

    /// <summary>
    /// Specific category filter (e.g., Fertilizers, Labour, Seeds).
    /// </summary>
    public string? ExpenseCategory { get; set; }

    /// <summary>
    /// Filter by Farmer name.
    /// </summary>
    public string? Farmer { get; set; }

    /// <summary>
    /// Filter by Farm name.
    /// </summary>
    public string? Farm { get; set; }

    /// <summary>
    /// Filter by Crop name.
    /// </summary>
    public string? Crop { get; set; }

    /// <summary>
    /// Filter by payment mode (Cash, Bank, etc.).
    /// </summary>
    public string? PaymentMode { get; set; }

    /// <summary>
    /// Filter by status (Paid, Pending, Partially Paid).
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Filter by start date (inclusive).
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// Filter by end date (inclusive).
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// Page number (1-based index).
    /// </summary>
    public int Page { get; set; } = 1;

    /// <summary>
    /// Number of items per page.
    /// </summary>
    public int PageSize { get; set; } = 10;

    /// <summary>
    /// Sort column (date, amount, expenseNo, farmer). Default is date descending.
    /// </summary>
    public string? SortBy { get; set; }

    /// <summary>
    /// Whether to sort in descending order (default: true).
    /// </summary>
    public bool SortDescending { get; set; } = true;
}
