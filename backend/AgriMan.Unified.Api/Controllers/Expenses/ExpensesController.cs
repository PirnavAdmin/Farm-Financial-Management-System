using AgriMan.Expenses.Api.Data;
using AgriMan.Expenses.Api.DTOs;
using AgriMan.Expenses.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text;

namespace AgriMan.Expenses.Api.Controllers;

/// <summary>
/// API endpoints for managing Farm Expenditures in the AGRIMAN Finance Workspace.
/// </summary>
[ApiController]
[Route("api/expenses")]
[Route("api/v1/expenses")]
[Produces("application/json")]
public class ExpensesController : ControllerBase
{
    private readonly ExpenseDbContext _context;
    private readonly ILogger<ExpensesController> _logger;
    private static readonly CultureInfo IndianCulture = new("en-IN");

    public ExpensesController(ExpenseDbContext context, ILogger<ExpensesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get paginated list of Farm Expenses with searching, category filtering, and UI workspace card metrics.
    /// </summary>
    /// <remarks>
    /// Matches the **Workspace / Expenses** UI:
    /// - Fast search across Expense No, Farmer, Farm, Crop, Supplier, Description, and Category
    /// - Returns top 3 card statistics: `Total Records`, `Rows on Page`, `Matching Filters`
    /// - Includes formatted currency ("₹18,500") and formatted dates ("22 Oct 2026")
    /// </remarks>
    /// <param name="parameters">Filter and pagination query options</param>
    /// <returns>Paged list of expenses with workspace summary metrics</returns>
    /// <response code="200">List of expense records and summary metrics</response>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ExpenseListItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<ExpenseListItemResponse>>> GetList([FromQuery] ExpenseListQueryParameters parameters)
    {
        var totalWorkspaceCount = await _context.ExpenseTransactions.CountAsync();

        var query = _context.ExpenseTransactions.AsNoTracking().AsQueryable();

        // 1. Text Search Filter across multiple columns
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            var search = parameters.Search.Trim().ToLower();
            query = query.Where(t =>
                t.ExpenseNo.ToLower().Contains(search) ||
                t.Farmer.ToLower().Contains(search) ||
                t.Farm.ToLower().Contains(search) ||
                t.Crop.ToLower().Contains(search) ||
                t.ExpenseCategory.ToLower().Contains(search) ||
                t.Supplier.ToLower().Contains(search) ||
                t.Description.ToLower().Contains(search) ||
                (t.ReferenceNo != null && t.ReferenceNo.ToLower().Contains(search)) ||
                (t.Remarks != null && t.Remarks.ToLower().Contains(search)));
        }

        // 2. Specific Category Filter
        if (!string.IsNullOrWhiteSpace(parameters.ExpenseCategory) && !parameters.ExpenseCategory.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            var cat = parameters.ExpenseCategory.Trim().ToLower();
            query = query.Where(t => t.ExpenseCategory.ToLower() == cat);
        }

        // 3. Farmer Filter
        if (!string.IsNullOrWhiteSpace(parameters.Farmer))
        {
            var farmer = parameters.Farmer.Trim().ToLower();
            query = query.Where(t => t.Farmer.ToLower().Contains(farmer));
        }

        // 4. Farm Filter
        if (!string.IsNullOrWhiteSpace(parameters.Farm))
        {
            var farm = parameters.Farm.Trim().ToLower();
            query = query.Where(t => t.Farm.ToLower().Contains(farm));
        }

        // 5. Crop Filter
        if (!string.IsNullOrWhiteSpace(parameters.Crop))
        {
            var crop = parameters.Crop.Trim().ToLower();
            query = query.Where(t => t.Crop.ToLower().Contains(crop));
        }

        // 6. Payment Mode Filter
        if (!string.IsNullOrWhiteSpace(parameters.PaymentMode) && !parameters.PaymentMode.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            var mode = parameters.PaymentMode.Trim().ToLower();
            query = query.Where(t => t.PaymentMode.ToLower() == mode);
        }

        // 7. Status Filter
        if (!string.IsNullOrWhiteSpace(parameters.Status) && !parameters.Status.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            var status = parameters.Status.Trim().ToLower();
            query = query.Where(t => t.Status.ToLower() == status);
        }

        // 8. Date Range Filters
        if (parameters.StartDate.HasValue)
        {
            query = query.Where(t => t.ExpenseDate >= parameters.StartDate.Value);
        }
        if (parameters.EndDate.HasValue)
        {
            query = query.Where(t => t.ExpenseDate <= parameters.EndDate.Value);
        }

        var matchingCount = await query.CountAsync();
        var totalAmount = await query.SumAsync(t => (decimal?)t.Amount) ?? 0m;

        // Sorting
        query = parameters.SortBy?.ToLower() switch
        {
            "amount" => parameters.SortDescending ? query.OrderByDescending(t => t.Amount) : query.OrderBy(t => t.Amount),
            "expenseno" => parameters.SortDescending ? query.OrderByDescending(t => t.ExpenseNo) : query.OrderBy(t => t.ExpenseNo),
            "farmer" => parameters.SortDescending ? query.OrderByDescending(t => t.Farmer) : query.OrderBy(t => t.Farmer),
            "farm" => parameters.SortDescending ? query.OrderByDescending(t => t.Farm) : query.OrderBy(t => t.Farm),
            "crop" => parameters.SortDescending ? query.OrderByDescending(t => t.Crop) : query.OrderBy(t => t.Crop),
            _ => parameters.SortDescending ? query.OrderByDescending(t => t.ExpenseDate).ThenByDescending(t => t.Id)
                                           : query.OrderBy(t => t.ExpenseDate).ThenBy(t => t.Id)
        };

        // Pagination
        var page = parameters.Page > 0 ? parameters.Page : 1;
        var pageSize = parameters.PageSize > 0 ? parameters.PageSize : 10;
        var totalPages = (int)Math.Ceiling((double)matchingCount / pageSize);

        var rawItems = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = rawItems.Select(t => new ExpenseListItemResponse
        {
            Id = t.Id,
            ExpenseDate = t.ExpenseDate,
            FormattedDate = t.ExpenseDate.ToString("dd MMM yyyy", CultureInfo.InvariantCulture),
            ExpenseNo = t.ExpenseNo,
            Farmer = t.Farmer,
            Farm = t.Farm,
            Crop = t.Crop,
            ExpenseCategory = t.ExpenseCategory,
            Supplier = t.Supplier,
            Description = t.Description,
            Amount = t.Amount,
            FormattedAmount = string.Format(IndianCulture, "₹{0:N0}", t.Amount),
            PaymentMode = t.PaymentMode,
            ReferenceNo = t.ReferenceNo ?? "—",
            Remarks = t.Remarks ?? "—",
            Status = t.Status
        }).ToList();

        var result = new PagedResult<ExpenseListItemResponse>
        {
            Data = items,
            Page = page,
            PageSize = pageSize,
            TotalRecords = matchingCount,
            TotalPages = totalPages,
            Metrics = new ExpenseSummaryMetricsDto
            {
                TotalRecords = totalWorkspaceCount,
                RowsOnPage = items.Count,
                MatchingFilters = matchingCount,
                TotalAmount = totalAmount,
                FormattedTotalAmount = string.Format(IndianCulture, "₹{0:N0}", totalAmount)
            }
        };

        return Ok(result);
    }

    /// <summary>
    /// Get workspace summary metric cards (Total Records, Rows on Page, Matching Filters, Total Expense).
    /// </summary>
    /// <response code="200">Summary metrics for UI dashboard cards</response>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(ExpenseSummaryMetricsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ExpenseSummaryMetricsDto>> GetSummary()
    {
        var count = await _context.ExpenseTransactions.CountAsync();
        var totalAmount = await _context.ExpenseTransactions.SumAsync(t => (decimal?)t.Amount) ?? 0m;

        return Ok(new ExpenseSummaryMetricsDto
        {
            TotalRecords = count,
            RowsOnPage = count,
            MatchingFilters = count,
            TotalAmount = totalAmount,
            FormattedTotalAmount = string.Format(IndianCulture, "₹{0:N0}", totalAmount)
        });
    }

    /// <summary>
    /// Suggest the next auto-generated Expense voucher number (e.g., EXP-2026-0099).
    /// </summary>
    /// <response code="200">Generated voucher number</response>
    [HttpGet("next-number")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult<object>> GetNextExpenseNumber()
    {
        var currentYear = DateTime.UtcNow.Year;
        var prefix = $"EXP-{currentYear}-";

        var latestExpense = await _context.ExpenseTransactions
            .Where(t => t.ExpenseNo.StartsWith(prefix))
            .OrderByDescending(t => t.ExpenseNo)
            .Select(t => t.ExpenseNo)
            .FirstOrDefaultAsync();

        int nextSequence = 1;
        if (!string.IsNullOrEmpty(latestExpense))
        {
            var parts = latestExpense.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[2], out int seq))
            {
                nextSequence = seq + 1;
            }
        }
        else
        {
            // If none for this year, check overall max sequence
            var count = await _context.ExpenseTransactions.CountAsync();
            nextSequence = count + 97; // starting near sample 97, 98
        }

        var nextNo = $"{prefix}{nextSequence:D4}";
        return Ok(new { nextExpenseNo = nextNo });
    }

    /// <summary>
    /// Get complete Expense details by Primary Key ID.
    /// </summary>
    /// <param name="id">Expense ID</param>
    /// <response code="200">Expense details including line items and payment records</response>
    /// <response code="404">Expense not found</response>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ExpenseDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ExpenseDetailResponse>> GetById(int id)
    {
        var entity = await _context.ExpenseTransactions
            .Include(e => e.Category)
            .Include(e => e.Items)
            .Include(e => e.Payments)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (entity == null)
        {
            return NotFound(new { message = $"Expense record with ID {id} was not found." });
        }

        return Ok(MapToDetailResponse(entity));
    }

    /// <summary>
    /// Get Expense record by voucher number (e.g., EXP-2026-0098).
    /// </summary>
    /// <param name="expenseNo">Voucher number</param>
    /// <response code="200">Expense details</response>
    /// <response code="404">Expense not found</response>
    [HttpGet("by-no/{expenseNo}")]
    [ProducesResponseType(typeof(ExpenseDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ExpenseDetailResponse>> GetByExpenseNo(string expenseNo)
    {
        var entity = await _context.ExpenseTransactions
            .Include(e => e.Category)
            .Include(e => e.Items)
            .Include(e => e.Payments)
            .FirstOrDefaultAsync(e => e.ExpenseNo.ToLower() == expenseNo.Trim().ToLower());

        if (entity == null)
        {
            return NotFound(new { message = $"Expense voucher '{expenseNo}' was not found." });
        }

        return Ok(MapToDetailResponse(entity));
    }

    /// <summary>
    /// Add a new Expense record (matches "Add Expenses record" modal UI).
    /// </summary>
    /// <remarks>
    /// - Auto-generates `ExpenseNo` (e.g., `EXP-2026-0099`) if not provided.
    /// - Defaults `ExpenseDate` to today if not provided.
    /// - Links or resolves `ExpenseCategory` with `expense_categories` lookup.
    /// - Automatically registers an entry in `expense_payments` ledger.
    /// - Creates line items in `expense_items` if supplied.
    /// </remarks>
    /// <param name="request">Expense transaction payload</param>
    /// <response code="201">Expense created successfully</response>
    /// <response code="400">Validation error or duplicate expense voucher number</response>
    [HttpPost]
    [ProducesResponseType(typeof(ExpenseDetailResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ExpenseDetailResponse>> Create([FromBody] ExpenseCreateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Auto-generate ExpenseNo if not provided
        var expenseNo = request.ExpenseNo?.Trim();
        if (string.IsNullOrWhiteSpace(expenseNo))
        {
            var year = (request.ExpenseDate ?? DateTime.UtcNow).Year;
            var maxId = (await _context.ExpenseTransactions.MaxAsync(t => (int?)t.Id)) ?? 0;
            expenseNo = $"EXP-{year}-{(maxId + 1 + 96):D4}";
        }
        else
        {
            // Verify uniqueness
            var exists = await _context.ExpenseTransactions.AnyAsync(e => e.ExpenseNo.ToLower() == expenseNo.ToLower());
            if (exists)
            {
                return BadRequest(new { message = $"An expense record with voucher number '{expenseNo}' already exists." });
            }
        }

        // Resolve CategoryId if omitted
        int? categoryId = request.CategoryId;
        if (!categoryId.HasValue && !string.IsNullOrWhiteSpace(request.ExpenseCategory))
        {
            var matchedCat = await _context.ExpenseCategories
                .FirstOrDefaultAsync(c => c.Name.ToLower() == request.ExpenseCategory.Trim().ToLower() ||
                                          c.Code.ToLower() == request.ExpenseCategory.Trim().ToLower());
            if (matchedCat != null)
            {
                categoryId = matchedCat.Id;
            }
        }

        var transactionDate = request.ExpenseDate ?? DateTime.UtcNow;

        var entity = new ExpenseTransaction
        {
            ExpenseNo = expenseNo,
            ExpenseDate = transactionDate,
            Farmer = request.Farmer.Trim(),
            Farm = request.Farm.Trim(),
            Crop = request.Crop.Trim(),
            CategoryId = categoryId,
            ExpenseCategory = request.ExpenseCategory.Trim(),
            Supplier = request.Supplier.Trim(),
            Description = request.Description.Trim(),
            Amount = request.Amount,
            PaymentMode = string.IsNullOrWhiteSpace(request.PaymentMode) ? "Cash" : request.PaymentMode.Trim(),
            ReferenceNo = string.IsNullOrWhiteSpace(request.ReferenceNo) ? null : request.ReferenceNo.Trim(),
            Remarks = string.IsNullOrWhiteSpace(request.Remarks) ? null : request.Remarks.Trim(),
            Status = string.IsNullOrWhiteSpace(request.Status) ? "Paid" : request.Status.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        // Add line items if provided, or create single item matching description
        if (request.Items != null && request.Items.Count > 0)
        {
            foreach (var item in request.Items)
            {
                entity.Items.Add(new ExpenseItem
                {
                    ItemName = item.ItemName.Trim(),
                    Quantity = item.Quantity,
                    Unit = string.IsNullOrWhiteSpace(item.Unit) ? "unit" : item.Unit.Trim(),
                    UnitPrice = item.UnitPrice,
                    TotalAmount = item.TotalAmount > 0 ? item.TotalAmount : (item.Quantity * item.UnitPrice),
                    Remarks = item.Remarks,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }
        else
        {
            entity.Items.Add(new ExpenseItem
            {
                ItemName = entity.Description,
                Quantity = 1,
                Unit = "unit",
                UnitPrice = entity.Amount,
                TotalAmount = entity.Amount,
                Remarks = entity.ExpenseCategory,
                CreatedAt = DateTime.UtcNow
            });
        }

        // Add ledger payment entry
        entity.Payments.Add(new ExpensePayment
        {
            PaymentDate = transactionDate,
            PaymentMode = entity.PaymentMode,
            Amount = entity.Amount,
            BankOrCash = entity.PaymentMode.Equals("Cash", StringComparison.OrdinalIgnoreCase) ? "Cash in Hand" : $"{entity.PaymentMode} Account",
            ReferenceNo = entity.ReferenceNo,
            Status = "Completed",
            Remarks = $"Disbursement for {entity.ExpenseNo} - {entity.Description}",
            CreatedAt = DateTime.UtcNow
        });

        _context.ExpenseTransactions.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created new Expense {ExpenseNo} of amount {Amount} for {Farmer}", entity.ExpenseNo, entity.Amount, entity.Farmer);

        var response = MapToDetailResponse(entity);
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, response);
    }

    /// <summary>
    /// Update an existing Expense record.
    /// </summary>
    /// <param name="id">Expense ID</param>
    /// <param name="request">Updated fields</param>
    /// <response code="200">Expense updated successfully</response>
    /// <response code="400">Invalid payload</response>
    /// <response code="404">Expense not found</response>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ExpenseDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ExpenseDetailResponse>> Update(int id, [FromBody] ExpenseUpdateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var entity = await _context.ExpenseTransactions
            .Include(e => e.Items)
            .Include(e => e.Payments)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (entity == null)
        {
            return NotFound(new { message = $"Expense record with ID {id} was not found." });
        }

        // Check uniqueness if expenseNo changed
        if (!entity.ExpenseNo.Equals(request.ExpenseNo.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            var duplicate = await _context.ExpenseTransactions.AnyAsync(e => e.Id != id && e.ExpenseNo.ToLower() == request.ExpenseNo.Trim().ToLower());
            if (duplicate)
            {
                return BadRequest(new { message = $"Voucher number '{request.ExpenseNo}' is already used by another record." });
            }
        }

        entity.ExpenseNo = request.ExpenseNo.Trim();
        entity.ExpenseDate = request.ExpenseDate;
        entity.Farmer = request.Farmer.Trim();
        entity.Farm = request.Farm.Trim();
        entity.Crop = request.Crop.Trim();
        entity.ExpenseCategory = request.ExpenseCategory.Trim();
        entity.CategoryId = request.CategoryId;
        entity.Supplier = request.Supplier.Trim();
        entity.Description = request.Description.Trim();
        entity.Amount = request.Amount;
        entity.PaymentMode = request.PaymentMode.Trim();
        entity.ReferenceNo = string.IsNullOrWhiteSpace(request.ReferenceNo) ? null : request.ReferenceNo.Trim();
        entity.Remarks = string.IsNullOrWhiteSpace(request.Remarks) ? null : request.Remarks.Trim();
        entity.Status = request.Status.Trim();
        entity.UpdatedAt = DateTime.UtcNow;

        // If items are supplied, replace existing items
        if (request.Items != null && request.Items.Count > 0)
        {
            _context.ExpenseItems.RemoveRange(entity.Items);
            foreach (var item in request.Items)
            {
                entity.Items.Add(new ExpenseItem
                {
                    ItemName = item.ItemName.Trim(),
                    Quantity = item.Quantity,
                    Unit = string.IsNullOrWhiteSpace(item.Unit) ? "unit" : item.Unit.Trim(),
                    UnitPrice = item.UnitPrice,
                    TotalAmount = item.TotalAmount > 0 ? item.TotalAmount : (item.Quantity * item.UnitPrice),
                    Remarks = item.Remarks,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(MapToDetailResponse(entity));
    }

    /// <summary>
    /// Delete an Expense record and associated ledger items.
    /// </summary>
    /// <param name="id">Expense ID</param>
    /// <response code="200">Expense deleted successfully</response>
    /// <response code="404">Expense not found</response>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Delete(int id)
    {
        var entity = await _context.ExpenseTransactions.FindAsync(id);
        if (entity == null)
        {
            return NotFound(new { message = $"Expense record with ID {id} was not found." });
        }

        _context.ExpenseTransactions.Remove(entity);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Expense record '{entity.ExpenseNo}' deleted successfully.", deletedId = id });
    }

    /// <summary>
    /// Export expenses in CSV format.
    /// </summary>
    /// <response code="200">CSV file stream</response>
    [HttpGet("export/csv")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportCsv([FromQuery] ExpenseListQueryParameters parameters)
    {
        var query = _context.ExpenseTransactions.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            var search = parameters.Search.Trim().ToLower();
            query = query.Where(t =>
                t.ExpenseNo.ToLower().Contains(search) ||
                t.Farmer.ToLower().Contains(search) ||
                t.Farm.ToLower().Contains(search) ||
                t.Crop.ToLower().Contains(search) ||
                t.ExpenseCategory.ToLower().Contains(search));
        }

        var list = await query.OrderByDescending(t => t.ExpenseDate).ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Expense Date,Expense No,Farmer,Farm,Crop,Expense Category,Supplier,Description,Amount,Payment Mode,Reference No,Remarks,Status");

        foreach (var item in list)
        {
            sb.AppendLine($"\"{item.ExpenseDate:yyyy-MM-dd}\",\"{EscapeCsv(item.ExpenseNo)}\",\"{EscapeCsv(item.Farmer)}\",\"{EscapeCsv(item.Farm)}\",\"{EscapeCsv(item.Crop)}\",\"{EscapeCsv(item.ExpenseCategory)}\",\"{EscapeCsv(item.Supplier)}\",\"{EscapeCsv(item.Description)}\",{item.Amount},\"{EscapeCsv(item.PaymentMode)}\",\"{EscapeCsv(item.ReferenceNo ?? "")}\",\"{EscapeCsv(item.Remarks ?? "")}\",\"{EscapeCsv(item.Status)}\"");
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return File(bytes, "text/csv", $"expenses_export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv");
    }

    private static string EscapeCsv(string value)
    {
        return value.Replace("\"", "\"\"");
    }

    private static ExpenseDetailResponse MapToDetailResponse(ExpenseTransaction entity)
    {
        return new ExpenseDetailResponse
        {
            Id = entity.Id,
            ExpenseDate = entity.ExpenseDate,
            FormattedDate = entity.ExpenseDate.ToString("dd MMM yyyy", CultureInfo.InvariantCulture),
            ExpenseNo = entity.ExpenseNo,
            Farmer = entity.Farmer,
            Farm = entity.Farm,
            Crop = entity.Crop,
            CategoryId = entity.CategoryId,
            ExpenseCategory = entity.ExpenseCategory,
            Supplier = entity.Supplier,
            Description = entity.Description,
            Amount = entity.Amount,
            FormattedAmount = string.Format(IndianCulture, "₹{0:N0}", entity.Amount),
            PaymentMode = entity.PaymentMode,
            ReferenceNo = entity.ReferenceNo ?? "—",
            Remarks = entity.Remarks ?? "—",
            Status = entity.Status,
            ReceiptAttachmentUrl = entity.ReceiptAttachmentUrl,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
            Items = entity.Items.Select(i => new ExpenseItemDto
            {
                Id = i.Id,
                ItemName = i.ItemName,
                Quantity = i.Quantity,
                Unit = i.Unit,
                UnitPrice = i.UnitPrice,
                TotalAmount = i.TotalAmount,
                Remarks = i.Remarks
            }).ToList(),
            Payments = entity.Payments.Select(p => new ExpensePaymentDto
            {
                Id = p.Id,
                PaymentDate = p.PaymentDate,
                PaymentMode = p.PaymentMode,
                Amount = p.Amount,
                BankOrCash = p.BankOrCash,
                ReferenceNo = p.ReferenceNo,
                Status = p.Status,
                Remarks = p.Remarks
            }).ToList()
        };
    }
}
