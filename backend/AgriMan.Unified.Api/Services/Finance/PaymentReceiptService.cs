using System.Globalization;
using System.Security.Claims;
using System.Text;
using AgriMan.Api.Services;
using FarmManagementApi.Data;
using FarmManagementApi.DTOs;
using FarmManagementApi.Models;
using Microsoft.EntityFrameworkCore;

namespace FarmManagementApi.Services
{
    public class PaymentReceiptService : IPaymentReceiptService
    {
        private readonly FarmDbContext _context;
        private readonly IAuditService _auditService;
        private readonly ILogger<PaymentReceiptService> _logger;

        private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "Completed", "Pending", "Processing", "Failed", "Cancelled"
        };

        public PaymentReceiptService(
            FarmDbContext context,
            IAuditService auditService,
            ILogger<PaymentReceiptService> logger)
        {
            _context = context;
            _auditService = auditService;
            _logger = logger;
        }

        // ══════════════════════════════════════════════════════════════════════
        // PAYMENTS (OUTFLOWS)
        // ══════════════════════════════════════════════════════════════════════

        public async Task<List<FinancePaymentResponseDto>> GetPaymentsAsync(PaymentQueryParameters parameters)
        {
            var query = BuildPaymentQuery(parameters);

            query = ApplyPaymentSorting(query, parameters.SortBy, parameters.SortDescending);

            if (parameters.Page.HasValue && parameters.PageSize.HasValue && parameters.Page > 0 && parameters.PageSize > 0)
            {
                query = query
                    .Skip((parameters.Page.Value - 1) * parameters.PageSize.Value)
                    .Take(parameters.PageSize.Value);
            }

            var items = await query.ToListAsync();
            return items.Select(MapPayment).ToList();
        }

        public async Task<FinancePaymentResponseDto?> GetPaymentByIdAsync(int id)
        {
            var entity = await _context.FinancePayments.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
            return entity == null ? null : MapPayment(entity);
        }

        public async Task<string> GetNextPaymentNoAsync()
        {
            var year = DateTime.UtcNow.Year;
            var prefix = $"PAY-{year}-";
            var existingNos = await _context.FinancePayments
                .AsNoTracking()
                .Where(p => p.PaymentNo.StartsWith(prefix))
                .Select(p => p.PaymentNo)
                .ToListAsync();

            var maxSeq = 0;
            foreach (var no in existingNos)
            {
                var suffix = no.Substring(prefix.Length);
                if (int.TryParse(suffix, out var seq) && seq > maxSeq)
                    maxSeq = seq;
            }

            return $"{prefix}{maxSeq + 1:D4}";
        }

        public async Task<PaymentSummaryDto> GetPaymentSummaryAsync(PaymentQueryParameters parameters)
        {
            var items = await BuildPaymentQuery(parameters).ToListAsync();
            var now = DateTime.UtcNow;
            var firstOfMonth = new DateTime(now.Year, now.Month, 1);

            var summary = new PaymentSummaryDto();

            foreach (var p in items)
            {
                var net = GetEffectivePaymentTotal(p);
                var status = NormalizeStatus(p.Status);

                switch (status)
                {
                    case "Completed":
                        summary.CompletedCount++;
                        summary.TotalRecords++;
                        summary.TotalPayments += net;
                        summary.SuccessfulAmount += net;
                        if (p.Date.Date >= firstOfMonth)
                            summary.ThisMonthAmount += net;
                        break;
                    case "Pending":
                        summary.PendingCount++;
                        summary.TotalRecords++;
                        summary.TotalPayments += net;
                        summary.PendingAmount += net;
                        break;
                    case "Processing":
                        summary.ProcessingCount++;
                        summary.TotalRecords++;
                        summary.TotalPayments += net;
                        summary.PendingAmount += net;
                        break;
                    case "Failed":
                        summary.FailedCount++;
                        summary.TotalRecords++;
                        summary.TotalPayments += net;
                        break;
                    case "Cancelled":
                        summary.CancelledCount++;
                        summary.CancelledAmount += net;
                        break;
                }
            }

            summary.TotalPayments = Math.Round(summary.TotalPayments, 2);
            summary.SuccessfulAmount = Math.Round(summary.SuccessfulAmount, 2);
            summary.PendingAmount = Math.Round(summary.PendingAmount, 2);
            summary.ThisMonthAmount = Math.Round(summary.ThisMonthAmount, 2);
            summary.CancelledAmount = Math.Round(summary.CancelledAmount, 2);

            return summary;
        }

        public async Task<FinanceServiceResult<PaymentVoucherDto>> GetPaymentVoucherAsync(int id)
        {
            var entity = await _context.FinancePayments.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
            if (entity == null)
                return FinanceServiceResult<PaymentVoucherDto>.Fail($"Payment with ID {id} was not found.", 404);

            var dto = MapPayment(entity);
            return FinanceServiceResult<PaymentVoucherDto>.Ok(new PaymentVoucherDto
            {
                VoucherTitle = "PAYMENT VOUCHER",
                Payment = dto,
                AmountInWords = NumberToWordsInr(dto.TotalAmount),
                GeneratedAt = DateTime.UtcNow
            });
        }

        public async Task<AnalyticsReportResponseDto<FinancePaymentResponseDto>> GetPaymentReportAsync(string reportType, PaymentQueryParameters parameters)
        {
            var key = (reportType ?? "summary").Trim().ToLowerInvariant();
            var rawItems = await BuildPaymentQuery(parameters)
                .OrderByDescending(p => p.Date)
                .ThenByDescending(p => p.Id)
                .ToListAsync();

            var activeItems = rawItems
                .Where(p => !string.Equals(NormalizeStatus(p.Status), "Cancelled", StringComparison.OrdinalIgnoreCase))
                .ToList();

            var response = new AnalyticsReportResponseDto<FinancePaymentResponseDto>
            {
                ReportType = key
            };

            switch (key)
            {
                case "by-purpose":
                    BuildGroupedPaymentReport(response, "Payments by Purpose / Category", activeItems,
                        p => string.IsNullOrWhiteSpace(p.Purpose) ? p.PaymentType : p.Purpose);
                    break;
                case "by-payee":
                    BuildGroupedPaymentReport(response, "Payments by Payee Name", activeItems,
                        p => string.IsNullOrWhiteSpace(p.Party) ? "Unspecified Payee" : p.Party);
                    break;
                case "by-payee-type":
                    BuildGroupedPaymentReport(response, "Payments by Payee Type", activeItems,
                        p => string.IsNullOrWhiteSpace(p.PayeeType) ? "Other Payee" : p.PayeeType);
                    break;
                case "by-mode":
                    BuildGroupedPaymentReport(response, "Payments by Payment Mode", activeItems,
                        p => string.IsNullOrWhiteSpace(p.PaymentMode) ? "Other" : p.PaymentMode);
                    break;
                case "by-farm":
                    BuildGroupedPaymentReport(response, "Payments by Farm Allocation", activeItems,
                        p => string.IsNullOrWhiteSpace(p.Farm) ? "General / Unassigned Farm" : p.Farm!);
                    break;
                case "by-crop":
                    BuildGroupedPaymentReport(response, "Payments by Crop Cost", activeItems,
                        p => string.IsNullOrWhiteSpace(p.Crop) ? "General / Non-Crop" : p.Crop!);
                    break;
                case "monthly-outflow":
                    BuildGroupedPaymentReport(response, "Monthly Outflow Trend", activeItems,
                        p => p.Date.ToString("yyyy-MM (MMM yyyy)", CultureInfo.InvariantCulture),
                        sortByLabelDescending: true);
                    break;
                case "seasonal-outflow":
                    BuildGroupedPaymentReport(response, "Seasonal Outflow", activeItems,
                        p => string.IsNullOrWhiteSpace(p.Season) ? "Unspecified Season" : p.Season!);
                    break;
                case "pending-disbursements":
                    var pending = rawItems
                        .Where(p => NormalizeStatus(p.Status) is "Pending" or "Processing")
                        .Select(MapPayment)
                        .ToList();
                    response.ReportTitle = "Pending Disbursements";
                    response.IsGrouped = false;
                    response.Items = pending;
                    response.TotalCount = pending.Count;
                    response.GrandTotal = Math.Round(pending.Sum(x => x.TotalAmount), 2);
                    break;
                case "cheques-issued":
                    var cheques = rawItems
                        .Where(p => string.Equals(p.PaymentMode, "Cheque", StringComparison.OrdinalIgnoreCase) || !string.IsNullOrWhiteSpace(p.ChequeNo))
                        .Select(MapPayment)
                        .ToList();
                    response.ReportTitle = "Cheques Issued Register";
                    response.IsGrouped = false;
                    response.Items = cheques;
                    response.TotalCount = cheques.Count;
                    response.GrandTotal = Math.Round(cheques.Sum(x => x.TotalAmount), 2);
                    break;
                case "top-disbursements":
                    var top = activeItems
                        .OrderByDescending(GetEffectivePaymentTotal)
                        .Take(20)
                        .Select(MapPayment)
                        .ToList();
                    response.ReportTitle = "Top Disbursements";
                    response.IsGrouped = false;
                    response.Items = top;
                    response.TotalCount = top.Count;
                    response.GrandTotal = Math.Round(top.Sum(x => x.TotalAmount), 2);
                    break;
                default:
                    var allMapped = rawItems.Select(MapPayment).ToList();
                    response.ReportType = "summary";
                    response.ReportTitle = "Payment Summary";
                    response.IsGrouped = false;
                    response.Items = allMapped;
                    response.TotalCount = activeItems.Count;
                    response.GrandTotal = Math.Round(activeItems.Sum(GetEffectivePaymentTotal), 2);
                    break;
            }

            return response;
        }

        public async Task<string> ExportPaymentsCsvAsync(PaymentQueryParameters parameters)
        {
            var items = await GetPaymentsAsync(parameters);
            var sb = new StringBuilder();
            sb.AppendLine("Payment No,Date,Purpose,Category,Payee Name,Payee Type,Farm,Field Parcel,Crop,Season,Ref Type,Ref No,Base Amount (INR),Additional Charges,Discount,Total Amount (INR),Payment Mode,Bank Account,Transaction Ref,Cheque No,Cheque Date,Status,Remarks");

            foreach (var r in items)
            {
                sb.AppendLine(string.Join(",",
                    CsvEscape(r.PaymentNo),
                    CsvEscape(r.PaymentDate),
                    CsvEscape(r.Purpose),
                    CsvEscape(r.Category),
                    CsvEscape(r.PayeeName),
                    CsvEscape(r.PayeeType),
                    CsvEscape(r.Farm),
                    CsvEscape(r.FieldParcel),
                    CsvEscape(r.Crop),
                    CsvEscape(r.Season),
                    CsvEscape(r.RefType),
                    CsvEscape(r.RefNo),
                    r.Amount.ToString("0.00", CultureInfo.InvariantCulture),
                    r.AdditionalCharges.ToString("0.00", CultureInfo.InvariantCulture),
                    r.Discount.ToString("0.00", CultureInfo.InvariantCulture),
                    r.TotalAmount.ToString("0.00", CultureInfo.InvariantCulture),
                    CsvEscape(r.PaymentMode),
                    CsvEscape(r.BankAccount),
                    CsvEscape(r.TransactionRef),
                    CsvEscape(r.ChequeNo),
                    CsvEscape(r.ChequeDate),
                    CsvEscape(r.Status),
                    CsvEscape(r.Remarks)));
            }

            return sb.ToString();
        }

        public async Task<FinanceServiceResult<FinancePaymentResponseDto>> CreatePaymentAsync(
            CreateFinancePaymentDto dto,
            ClaimsPrincipal? actor,
            string? ipAddress)
        {
            var validationError = ValidatePaymentInput(dto);
            if (validationError != null)
                return FinanceServiceResult<FinancePaymentResponseDto>.Fail(validationError, 400);

            var paymentNo = string.IsNullOrWhiteSpace(dto.PaymentNo)
                ? await GetNextPaymentNoAsync()
                : dto.PaymentNo.Trim();

            var duplicateExists = await _context.FinancePayments
                .AsNoTracking()
                .AnyAsync(p => p.PaymentNo.ToLower() == paymentNo.ToLower());
            if (duplicateExists)
                return FinanceServiceResult<FinancePaymentResponseDto>.Fail($"Payment voucher number '{paymentNo}' already exists.", 409);

            var status = NormalizeStatus(dto.Status ?? "Completed");
            if (!AllowedStatuses.Contains(status))
                return FinanceServiceResult<FinancePaymentResponseDto>.Fail($"Invalid payment status '{dto.Status}'. Allowed values: Completed, Pending, Processing, Failed, Cancelled.", 400);

            var amount = Math.Round(dto.Amount, 2);
            var additionalCharges = Math.Max(0m, Math.Round(dto.AdditionalCharges, 2));
            var discount = Math.Max(0m, Math.Round(dto.Discount, 2));
            var totalAmount = ComputePaymentTotal(amount, additionalCharges, discount);

            var purpose = FirstNonEmpty(dto.Purpose, dto.PaymentType, "Supplier Payment");
            var payeeName = FirstNonEmpty(dto.PayeeName, dto.Party, string.Empty);
            var paymentMode = FirstNonEmpty(dto.PaymentMode, "Bank Transfer");
            var refNo = FirstNonEmpty(dto.RefNo, dto.ReferenceTransaction, string.Empty);
            var txnRef = FirstNonEmpty(dto.TransactionRef, dto.ReferenceNo, string.Empty);

            var bankAccount = await ResolveBankAccountAsync(dto.BankAccountId, dto.BankAccount);
            var bankAccountName = !string.IsNullOrWhiteSpace(dto.BankAccount)
                ? dto.BankAccount.Trim()
                : (bankAccount != null ? bankAccount.AccountName : "Main Operational Account");

            var entity = new FinancePayment
            {
                PaymentNo = paymentNo,
                Date = dto.PaymentDate ?? dto.Date ?? DateTime.UtcNow,
                Party = payeeName,
                PaymentType = FirstNonEmpty(dto.PaymentType, purpose),
                Purpose = purpose,
                Category = FirstNonEmpty(dto.Category, purpose),
                PayeeType = FirstNonEmpty(dto.PayeeType, "Supplier / Vendor"),
                ContactInfo = dto.ContactInfo?.Trim(),
                Farm = dto.Farm?.Trim(),
                FieldParcel = dto.FieldParcel?.Trim(),
                Crop = dto.Crop?.Trim(),
                Season = dto.Season?.Trim(),
                RefType = FirstNonEmpty(dto.RefType, "None"),
                ReferenceTransaction = string.IsNullOrWhiteSpace(refNo) ? null : refNo,
                OriginalAmount = dto.OriginalAmount.HasValue && dto.OriginalAmount.Value > 0
                    ? Math.Round(dto.OriginalAmount.Value, 2)
                    : amount,
                OutstandingAmount = Math.Max(0m, Math.Round(dto.OutstandingAmount ?? 0m, 2)),
                Amount = amount,
                AdditionalCharges = additionalCharges,
                Discount = discount,
                TotalAmount = totalAmount,
                PaymentMode = paymentMode,
                BankAccountId = bankAccount?.Id ?? dto.BankAccountId,
                BankAccount = bankAccountName,
                ReferenceNo = string.IsNullOrWhiteSpace(txnRef) ? null : txnRef,
                ChequeNo = dto.ChequeNo?.Trim(),
                ChequeDate = dto.ChequeDate,
                SupplierId = dto.SupplierId,
                LabourId = dto.LabourId,
                Remarks = dto.Remarks?.Trim(),
                Status = status,
                CancelledAt = status == "Cancelled" ? DateTime.UtcNow : null,
                CreatedAt = DateTime.UtcNow
            };

            _context.FinancePayments.Add(entity);

            if (status == "Completed" && bankAccount != null)
            {
                bankAccount.CurrentBalance = Math.Round(bankAccount.CurrentBalance - totalAmount, 2);
                bankAccount.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            await TryAuditAsync(actor, "CREATE", "FinancePayment", entity.PaymentNo,
                $"Payee={entity.Party}; Purpose={entity.Purpose}; TotalAmount={entity.TotalAmount:0.00}; Mode={entity.PaymentMode}; Status={entity.Status}",
                ipAddress);

            return FinanceServiceResult<FinancePaymentResponseDto>.Ok(MapPayment(entity), 201);
        }

        public async Task<FinanceServiceResult<FinancePaymentResponseDto>> UpdatePaymentAsync(
            int id,
            UpdateFinancePaymentDto dto,
            ClaimsPrincipal? actor,
            string? ipAddress)
        {
            var entity = await _context.FinancePayments.FirstOrDefaultAsync(p => p.Id == id);
            if (entity == null)
                return FinanceServiceResult<FinancePaymentResponseDto>.Fail($"Payment with ID {id} was not found.", 404);

            var validationError = ValidatePaymentInput(dto);
            if (validationError != null)
                return FinanceServiceResult<FinancePaymentResponseDto>.Fail(validationError, 400);

            var newStatus = NormalizeStatus(dto.Status ?? entity.Status);
            if (!AllowedStatuses.Contains(newStatus))
                return FinanceServiceResult<FinancePaymentResponseDto>.Fail($"Invalid payment status '{dto.Status}'.", 400);

            if (!string.IsNullOrWhiteSpace(dto.PaymentNo) &&
                !string.Equals(dto.PaymentNo.Trim(), entity.PaymentNo, StringComparison.OrdinalIgnoreCase))
            {
                var nextNo = dto.PaymentNo.Trim();
                var dup = await _context.FinancePayments.AsNoTracking()
                    .AnyAsync(p => p.Id != id && p.PaymentNo.ToLower() == nextNo.ToLower());
                if (dup)
                    return FinanceServiceResult<FinancePaymentResponseDto>.Fail($"Payment voucher number '{nextNo}' already exists.", 409);
                entity.PaymentNo = nextNo;
            }

            // Reverse prior bank debit if previously Completed
            var oldStatus = NormalizeStatus(entity.Status);
            var oldTotal = GetEffectivePaymentTotal(entity);
            if (oldStatus == "Completed")
            {
                var oldBank = await ResolveBankAccountAsync(entity.BankAccountId, entity.BankAccount);
                if (oldBank != null)
                {
                    oldBank.CurrentBalance = Math.Round(oldBank.CurrentBalance + oldTotal, 2);
                    oldBank.UpdatedAt = DateTime.UtcNow;
                }
            }

            var amount = Math.Round(dto.Amount, 2);
            var additionalCharges = Math.Max(0m, Math.Round(dto.AdditionalCharges, 2));
            var discount = Math.Max(0m, Math.Round(dto.Discount, 2));
            var newTotal = ComputePaymentTotal(amount, additionalCharges, discount);

            var purpose = FirstNonEmpty(dto.Purpose, dto.PaymentType, entity.Purpose);
            var payeeName = FirstNonEmpty(dto.PayeeName, dto.Party, entity.Party);
            var paymentMode = FirstNonEmpty(dto.PaymentMode, entity.PaymentMode);
            var refNo = FirstNonEmpty(dto.RefNo, dto.ReferenceTransaction, string.Empty);
            var txnRef = FirstNonEmpty(dto.TransactionRef, dto.ReferenceNo, string.Empty);

            var newBank = await ResolveBankAccountAsync(dto.BankAccountId, dto.BankAccount ?? entity.BankAccount);
            var bankAccountName = !string.IsNullOrWhiteSpace(dto.BankAccount)
                ? dto.BankAccount.Trim()
                : (newBank != null ? newBank.AccountName : entity.BankAccount);

            entity.Date = dto.PaymentDate ?? dto.Date ?? entity.Date;
            entity.Party = payeeName;
            entity.PaymentType = FirstNonEmpty(dto.PaymentType, purpose);
            entity.Purpose = purpose;
            entity.Category = FirstNonEmpty(dto.Category, purpose);
            entity.PayeeType = FirstNonEmpty(dto.PayeeType, entity.PayeeType);
            entity.ContactInfo = dto.ContactInfo?.Trim();
            entity.Farm = dto.Farm?.Trim();
            entity.FieldParcel = dto.FieldParcel?.Trim();
            entity.Crop = dto.Crop?.Trim();
            entity.Season = dto.Season?.Trim();
            entity.RefType = FirstNonEmpty(dto.RefType, entity.RefType);
            entity.ReferenceTransaction = string.IsNullOrWhiteSpace(refNo) ? null : refNo;
            entity.OriginalAmount = dto.OriginalAmount.HasValue && dto.OriginalAmount.Value > 0
                ? Math.Round(dto.OriginalAmount.Value, 2)
                : amount;
            entity.OutstandingAmount = Math.Max(0m, Math.Round(dto.OutstandingAmount ?? entity.OutstandingAmount, 2));
            entity.Amount = amount;
            entity.AdditionalCharges = additionalCharges;
            entity.Discount = discount;
            entity.TotalAmount = newTotal;
            entity.PaymentMode = paymentMode;
            entity.BankAccountId = newBank?.Id ?? dto.BankAccountId;
            entity.BankAccount = bankAccountName;
            entity.ReferenceNo = string.IsNullOrWhiteSpace(txnRef) ? null : txnRef;
            entity.ChequeNo = dto.ChequeNo?.Trim();
            entity.ChequeDate = dto.ChequeDate;
            entity.SupplierId = dto.SupplierId ?? entity.SupplierId;
            entity.LabourId = dto.LabourId ?? entity.LabourId;
            entity.Remarks = dto.Remarks?.Trim();
            entity.Status = newStatus;
            entity.CancelledAt = newStatus == "Cancelled" ? (entity.CancelledAt ?? DateTime.UtcNow) : null;
            if (newStatus != "Cancelled") entity.CancellationReason = null;
            entity.UpdatedAt = DateTime.UtcNow;

            // Apply new bank debit if now Completed
            if (newStatus == "Completed" && newBank != null)
            {
                newBank.CurrentBalance = Math.Round(newBank.CurrentBalance - newTotal, 2);
                newBank.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            await TryAuditAsync(actor, "UPDATE", "FinancePayment", entity.PaymentNo,
                $"Payee={entity.Party}; TotalAmount={entity.TotalAmount:0.00}; Status={entity.Status}",
                ipAddress);

            return FinanceServiceResult<FinancePaymentResponseDto>.Ok(MapPayment(entity));
        }

        public async Task<FinanceServiceResult<FinancePaymentResponseDto>> UpdatePaymentStatusAsync(
            int id,
            UpdateTransactionStatusDto dto,
            ClaimsPrincipal? actor,
            string? ipAddress)
        {
            var entity = await _context.FinancePayments.FirstOrDefaultAsync(p => p.Id == id);
            if (entity == null)
                return FinanceServiceResult<FinancePaymentResponseDto>.Fail($"Payment with ID {id} was not found.", 404);

            var newStatus = NormalizeStatus(dto.Status);
            if (!AllowedStatuses.Contains(newStatus))
                return FinanceServiceResult<FinancePaymentResponseDto>.Fail($"Invalid payment status '{dto.Status}'. Allowed values: Completed, Pending, Processing, Failed, Cancelled.", 400);

            var oldStatus = NormalizeStatus(entity.Status);
            var effectiveTotal = GetEffectivePaymentTotal(entity);

            if (oldStatus != newStatus)
            {
                var bank = await ResolveBankAccountAsync(entity.BankAccountId, entity.BankAccount);
                if (bank != null)
                {
                    if (oldStatus == "Completed")
                        bank.CurrentBalance = Math.Round(bank.CurrentBalance + effectiveTotal, 2);
                    if (newStatus == "Completed")
                        bank.CurrentBalance = Math.Round(bank.CurrentBalance - effectiveTotal, 2);
                    bank.UpdatedAt = DateTime.UtcNow;
                }
            }

            entity.Status = newStatus;
            if (newStatus == "Cancelled")
            {
                entity.CancellationReason = string.IsNullOrWhiteSpace(dto.Reason) ? "Payment cancelled" : dto.Reason.Trim();
                entity.CancelledAt = DateTime.UtcNow;
                if (!string.IsNullOrWhiteSpace(dto.Reason))
                    entity.Remarks = dto.Reason.Trim();
            }
            else
            {
                entity.CancellationReason = null;
                entity.CancelledAt = null;
            }
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await TryAuditAsync(actor, "STATUS_CHANGE", "FinancePayment", entity.PaymentNo,
                $"OldStatus={oldStatus}; NewStatus={newStatus}; Reason={dto.Reason}",
                ipAddress);

            return FinanceServiceResult<FinancePaymentResponseDto>.Ok(MapPayment(entity));
        }

        public Task<FinanceServiceResult<FinancePaymentResponseDto>> CancelPaymentAsync(
            int id,
            CancelTransactionDto? dto,
            ClaimsPrincipal? actor,
            string? ipAddress)
        {
            var reason = string.IsNullOrWhiteSpace(dto?.Reason)
                ? "Payment cancelled or reversed"
                : dto!.Reason!.Trim();

            return UpdatePaymentStatusAsync(id, new UpdateTransactionStatusDto
            {
                Status = "Cancelled",
                Reason = reason
            }, actor, ipAddress);
        }

        public async Task<FinanceServiceResult<bool>> DeletePaymentAsync(int id, ClaimsPrincipal? actor, string? ipAddress)
        {
            var entity = await _context.FinancePayments.FirstOrDefaultAsync(p => p.Id == id);
            if (entity == null)
                return FinanceServiceResult<bool>.Fail($"Payment with ID {id} was not found.", 404);

            if (NormalizeStatus(entity.Status) == "Completed")
            {
                var bank = await ResolveBankAccountAsync(entity.BankAccountId, entity.BankAccount);
                if (bank != null)
                {
                    bank.CurrentBalance = Math.Round(bank.CurrentBalance + GetEffectivePaymentTotal(entity), 2);
                    bank.UpdatedAt = DateTime.UtcNow;
                }
            }

            var paymentNo = entity.PaymentNo;
            var total = GetEffectivePaymentTotal(entity);

            _context.FinancePayments.Remove(entity);
            await _context.SaveChangesAsync();

            await TryAuditAsync(actor, "DELETE", "FinancePayment", paymentNo,
                $"Deleted payment {paymentNo} (TotalAmount={total:0.00})",
                ipAddress);

            return FinanceServiceResult<bool>.Ok(true);
        }

        // ══════════════════════════════════════════════════════════════════════
        // RECEIPTS (INFLOWS)
        // ══════════════════════════════════════════════════════════════════════

        public async Task<List<FinanceReceiptResponseDto>> GetReceiptsAsync(ReceiptQueryParameters parameters)
        {
            var query = BuildReceiptQuery(parameters);

            query = ApplyReceiptSorting(query, parameters.SortBy, parameters.SortDescending);

            if (parameters.Page.HasValue && parameters.PageSize.HasValue && parameters.Page > 0 && parameters.PageSize > 0)
            {
                query = query
                    .Skip((parameters.Page.Value - 1) * parameters.PageSize.Value)
                    .Take(parameters.PageSize.Value);
            }

            var items = await query.ToListAsync();
            return items.Select(MapReceipt).ToList();
        }

        public async Task<FinanceReceiptResponseDto?> GetReceiptByIdAsync(int id)
        {
            var entity = await _context.FinanceReceipts.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id);
            return entity == null ? null : MapReceipt(entity);
        }

        public async Task<string> GetNextReceiptNoAsync()
        {
            var year = DateTime.UtcNow.Year;
            var prefix = $"REC-{year}-";
            var existingNos = await _context.FinanceReceipts
                .AsNoTracking()
                .Where(r => r.ReceiptNo.StartsWith(prefix))
                .Select(r => r.ReceiptNo)
                .ToListAsync();

            var maxSeq = 0;
            foreach (var no in existingNos)
            {
                var suffix = no.Substring(prefix.Length);
                if (int.TryParse(suffix, out var seq) && seq > maxSeq)
                    maxSeq = seq;
            }

            return $"{prefix}{maxSeq + 1:D4}";
        }

        public async Task<ReceiptSummaryDto> GetReceiptSummaryAsync(ReceiptQueryParameters parameters)
        {
            var items = await BuildReceiptQuery(parameters).ToListAsync();
            var now = DateTime.UtcNow;
            var firstOfMonth = new DateTime(now.Year, now.Month, 1);

            var summary = new ReceiptSummaryDto();

            foreach (var r in items)
            {
                var net = GetEffectiveReceiptTotal(r);
                var status = NormalizeStatus(r.Status);

                switch (status)
                {
                    case "Completed":
                        summary.CompletedCount++;
                        summary.TotalReceipts++;
                        summary.TotalReceived += net;
                        if (r.Date.Date >= firstOfMonth)
                            summary.ThisMonthAmount += net;
                        break;
                    case "Pending":
                        summary.PendingCount++;
                        summary.TotalReceipts++;
                        summary.PendingReceivables += net;
                        break;
                    case "Processing":
                        summary.ProcessingCount++;
                        summary.TotalReceipts++;
                        summary.PendingReceivables += net;
                        break;
                    case "Failed":
                        summary.FailedCount++;
                        summary.TotalReceipts++;
                        break;
                    case "Cancelled":
                        summary.CancelledCount++;
                        summary.CancelledAmount += net;
                        break;
                }
            }

            summary.TotalReceived = Math.Round(summary.TotalReceived, 2);
            summary.PendingReceivables = Math.Round(summary.PendingReceivables, 2);
            summary.ThisMonthAmount = Math.Round(summary.ThisMonthAmount, 2);
            summary.CancelledAmount = Math.Round(summary.CancelledAmount, 2);

            return summary;
        }

        public async Task<FinanceServiceResult<ReceiptVoucherDto>> GetReceiptVoucherAsync(int id)
        {
            var entity = await _context.FinanceReceipts.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id);
            if (entity == null)
                return FinanceServiceResult<ReceiptVoucherDto>.Fail($"Receipt with ID {id} was not found.", 404);

            var dto = MapReceipt(entity);
            return FinanceServiceResult<ReceiptVoucherDto>.Ok(new ReceiptVoucherDto
            {
                VoucherTitle = "OFFICIAL RECEIPT",
                Receipt = dto,
                AmountInWords = NumberToWordsInr(dto.FinalAmount),
                GeneratedAt = DateTime.UtcNow
            });
        }

        public async Task<AnalyticsReportResponseDto<FinanceReceiptResponseDto>> GetReceiptReportAsync(string reportType, ReceiptQueryParameters parameters)
        {
            var key = (reportType ?? "summary").Trim().ToLowerInvariant();
            var rawItems = await BuildReceiptQuery(parameters)
                .OrderByDescending(r => r.Date)
                .ThenByDescending(r => r.Id)
                .ToListAsync();

            var activeItems = rawItems
                .Where(r => !string.Equals(NormalizeStatus(r.Status), "Cancelled", StringComparison.OrdinalIgnoreCase))
                .ToList();

            var response = new AnalyticsReportResponseDto<FinanceReceiptResponseDto>
            {
                ReportType = key
            };

            switch (key)
            {
                case "by-purpose":
                    BuildGroupedReceiptReport(response, "Receipts by Purpose / Category", activeItems,
                        r => string.IsNullOrWhiteSpace(r.Purpose) ? "Crop Sales" : r.Purpose);
                    break;
                case "by-payer":
                    BuildGroupedReceiptReport(response, "Customer-wise Collections", activeItems,
                        r => string.IsNullOrWhiteSpace(r.From) ? "Unspecified Customer" : r.From);
                    break;
                case "by-payer-type":
                    BuildGroupedReceiptReport(response, "Receipts by Payer Type", activeItems,
                        r => string.IsNullOrWhiteSpace(r.PayerType) ? "Other Payer" : r.PayerType);
                    break;
                case "by-mode":
                    BuildGroupedReceiptReport(response, "Collection Mode-wise Receipts", activeItems,
                        r => string.IsNullOrWhiteSpace(r.PaymentMode) ? "Other" : r.PaymentMode);
                    break;
                case "by-farm":
                    BuildGroupedReceiptReport(response, "Farm-wise Collections", activeItems,
                        r => string.IsNullOrWhiteSpace(r.Farm) ? "General / Unassigned Farm" : r.Farm!);
                    break;
                case "by-crop":
                    BuildGroupedReceiptReport(response, "Crop-wise Collections", activeItems,
                        r => string.IsNullOrWhiteSpace(r.Crop) ? "General / Non-Crop" : r.Crop!);
                    break;
                case "monthly-receipts":
                    BuildGroupedReceiptReport(response, "Monthly Receipts Trend", activeItems,
                        r => r.Date.ToString("yyyy-MM (MMM yyyy)", CultureInfo.InvariantCulture),
                        sortByLabelDescending: true);
                    break;
                case "seasonal-receipts":
                    BuildGroupedReceiptReport(response, "Seasonal Collections", activeItems,
                        r => string.IsNullOrWhiteSpace(r.Season) ? "Unspecified Season" : r.Season!);
                    break;
                case "pending-receivables":
                    var pending = rawItems
                        .Where(r => NormalizeStatus(r.Status) is "Pending" or "Processing")
                        .Select(MapReceipt)
                        .ToList();
                    response.ReportTitle = "Pending Receivables";
                    response.IsGrouped = false;
                    response.Items = pending;
                    response.TotalCount = pending.Count;
                    response.GrandTotal = Math.Round(pending.Sum(x => x.FinalAmount), 2);
                    break;
                case "cheques-register":
                    var cheques = rawItems
                        .Where(r => string.Equals(r.PaymentMode, "Cheque", StringComparison.OrdinalIgnoreCase) || !string.IsNullOrWhiteSpace(r.ChequeNo))
                        .Select(MapReceipt)
                        .ToList();
                    response.ReportTitle = "Cheques Register";
                    response.IsGrouped = false;
                    response.Items = cheques;
                    response.TotalCount = cheques.Count;
                    response.GrandTotal = Math.Round(cheques.Sum(x => x.FinalAmount), 2);
                    break;
                case "top-collections":
                    var top = activeItems
                        .OrderByDescending(GetEffectiveReceiptTotal)
                        .Take(20)
                        .Select(MapReceipt)
                        .ToList();
                    response.ReportTitle = "Top Collections";
                    response.IsGrouped = false;
                    response.Items = top;
                    response.TotalCount = top.Count;
                    response.GrandTotal = Math.Round(top.Sum(x => x.FinalAmount), 2);
                    break;
                default:
                    var allMapped = rawItems.Select(MapReceipt).ToList();
                    response.ReportType = "summary";
                    response.ReportTitle = "Receipt Summary";
                    response.IsGrouped = false;
                    response.Items = allMapped;
                    response.TotalCount = activeItems.Count;
                    response.GrandTotal = Math.Round(activeItems.Sum(GetEffectiveReceiptTotal), 2);
                    break;
            }

            return response;
        }

        public async Task<string> ExportReceiptsCsvAsync(ReceiptQueryParameters parameters)
        {
            var items = await GetReceiptsAsync(parameters);
            var sb = new StringBuilder();
            sb.AppendLine("Receipt No,Date,Purpose,Category,Customer / Payer,Payer Type,Farm,Field Parcel,Crop,Season,Ref Type,Ref No,Base Amount (INR),Discount,Other Charges,Final Amount (INR),Collection Mode,Bank Account,Transaction Ref,Cheque No,Cheque Date,Status,Remarks");

            foreach (var r in items)
            {
                sb.AppendLine(string.Join(",",
                    CsvEscape(r.ReceiptNo),
                    CsvEscape(r.ReceiptDate),
                    CsvEscape(r.Purpose),
                    CsvEscape(r.Category),
                    CsvEscape(r.PayerName),
                    CsvEscape(r.PayerType),
                    CsvEscape(r.Farm),
                    CsvEscape(r.FieldParcel),
                    CsvEscape(r.Crop),
                    CsvEscape(r.Season),
                    CsvEscape(r.RefType),
                    CsvEscape(r.RefNo),
                    r.Amount.ToString("0.00", CultureInfo.InvariantCulture),
                    r.Discount.ToString("0.00", CultureInfo.InvariantCulture),
                    r.OtherCharges.ToString("0.00", CultureInfo.InvariantCulture),
                    r.FinalAmount.ToString("0.00", CultureInfo.InvariantCulture),
                    CsvEscape(r.CollectionMode),
                    CsvEscape(r.BankAccount),
                    CsvEscape(r.TransactionRef),
                    CsvEscape(r.ChequeNo),
                    CsvEscape(r.ChequeDate),
                    CsvEscape(r.Status),
                    CsvEscape(r.Remarks)));
            }

            return sb.ToString();
        }

        public async Task<FinanceServiceResult<FinanceReceiptResponseDto>> CreateReceiptAsync(
            CreateFinanceReceiptDto dto,
            ClaimsPrincipal? actor,
            string? ipAddress)
        {
            var validationError = ValidateReceiptInput(dto);
            if (validationError != null)
                return FinanceServiceResult<FinanceReceiptResponseDto>.Fail(validationError, 400);

            var receiptNo = string.IsNullOrWhiteSpace(dto.ReceiptNo)
                ? await GetNextReceiptNoAsync()
                : dto.ReceiptNo.Trim();

            var duplicateExists = await _context.FinanceReceipts
                .AsNoTracking()
                .AnyAsync(r => r.ReceiptNo.ToLower() == receiptNo.ToLower());
            if (duplicateExists)
                return FinanceServiceResult<FinanceReceiptResponseDto>.Fail($"Receipt voucher number '{receiptNo}' already exists.", 409);

            var status = NormalizeStatus(dto.Status ?? "Completed");
            if (!AllowedStatuses.Contains(status))
                return FinanceServiceResult<FinanceReceiptResponseDto>.Fail($"Invalid receipt status '{dto.Status}'. Allowed values: Completed, Pending, Processing, Failed, Cancelled.", 400);

            var amount = Math.Round(dto.Amount, 2);
            var discount = Math.Max(0m, Math.Round(dto.Discount, 2));
            var otherCharges = Math.Max(0m, Math.Round(dto.OtherCharges, 2));
            var finalAmount = ComputeReceiptTotal(amount, discount, otherCharges);

            var purpose = FirstNonEmpty(dto.Purpose, "Crop Sales");
            var payerName = FirstNonEmpty(dto.PayerName, dto.From, string.Empty);
            var mode = FirstNonEmpty(dto.CollectionMode, dto.PaymentMode, "Bank Transfer");
            var refNo = FirstNonEmpty(dto.RefNo, dto.Reference, string.Empty);

            var bankAccount = await ResolveBankAccountAsync(dto.BankAccountId, dto.BankAccount);
            var bankAccountName = !string.IsNullOrWhiteSpace(dto.BankAccount)
                ? dto.BankAccount.Trim()
                : (bankAccount != null ? bankAccount.AccountName : "Main Farm Account");

            var entity = new FinanceReceipt
            {
                ReceiptNo = receiptNo,
                Date = dto.ReceiptDate ?? dto.Date ?? DateTime.UtcNow,
                From = payerName,
                Purpose = purpose,
                Category = FirstNonEmpty(dto.Category, purpose),
                PayerType = FirstNonEmpty(dto.PayerType, "Wholesale Buyer / Trader"),
                ContactInfo = dto.ContactInfo?.Trim(),
                Farm = dto.Farm?.Trim(),
                FieldParcel = dto.FieldParcel?.Trim(),
                Crop = dto.Crop?.Trim(),
                Season = dto.Season?.Trim(),
                RefType = FirstNonEmpty(dto.RefType, "None"),
                Reference = string.IsNullOrWhiteSpace(refNo) ? null : refNo,
                OriginalAmount = dto.OriginalAmount.HasValue && dto.OriginalAmount.Value > 0
                    ? Math.Round(dto.OriginalAmount.Value, 2)
                    : amount,
                OutstandingAmount = Math.Max(0m, Math.Round(dto.OutstandingAmount ?? 0m, 2)),
                Amount = amount,
                Discount = discount,
                OtherCharges = otherCharges,
                FinalAmount = finalAmount,
                PaymentMode = mode,
                BankAccountId = bankAccount?.Id ?? dto.BankAccountId,
                BankAccount = bankAccountName,
                TransactionRef = dto.TransactionRef?.Trim(),
                ChequeNo = dto.ChequeNo?.Trim(),
                ChequeDate = dto.ChequeDate,
                BuyerId = dto.BuyerId,
                SaleId = dto.SaleId,
                Remarks = dto.Remarks?.Trim(),
                Status = status,
                CancelledAt = status == "Cancelled" ? DateTime.UtcNow : null,
                CreatedAt = DateTime.UtcNow
            };

            _context.FinanceReceipts.Add(entity);

            if (status == "Completed" && bankAccount != null)
            {
                bankAccount.CurrentBalance = Math.Round(bankAccount.CurrentBalance + finalAmount, 2);
                bankAccount.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            await TryAuditAsync(actor, "CREATE", "FinanceReceipt", entity.ReceiptNo,
                $"Payer={entity.From}; Purpose={entity.Purpose}; FinalAmount={entity.FinalAmount:0.00}; Mode={entity.PaymentMode}; Status={entity.Status}",
                ipAddress);

            return FinanceServiceResult<FinanceReceiptResponseDto>.Ok(MapReceipt(entity), 201);
        }

        public async Task<FinanceServiceResult<FinanceReceiptResponseDto>> UpdateReceiptAsync(
            int id,
            UpdateFinanceReceiptDto dto,
            ClaimsPrincipal? actor,
            string? ipAddress)
        {
            var entity = await _context.FinanceReceipts.FirstOrDefaultAsync(r => r.Id == id);
            if (entity == null)
                return FinanceServiceResult<FinanceReceiptResponseDto>.Fail($"Receipt with ID {id} was not found.", 404);

            var validationError = ValidateReceiptInput(dto);
            if (validationError != null)
                return FinanceServiceResult<FinanceReceiptResponseDto>.Fail(validationError, 400);

            var newStatus = NormalizeStatus(dto.Status ?? entity.Status);
            if (!AllowedStatuses.Contains(newStatus))
                return FinanceServiceResult<FinanceReceiptResponseDto>.Fail($"Invalid receipt status '{dto.Status}'.", 400);

            if (!string.IsNullOrWhiteSpace(dto.ReceiptNo) &&
                !string.Equals(dto.ReceiptNo.Trim(), entity.ReceiptNo, StringComparison.OrdinalIgnoreCase))
            {
                var nextNo = dto.ReceiptNo.Trim();
                var dup = await _context.FinanceReceipts.AsNoTracking()
                    .AnyAsync(r => r.Id != id && r.ReceiptNo.ToLower() == nextNo.ToLower());
                if (dup)
                    return FinanceServiceResult<FinanceReceiptResponseDto>.Fail($"Receipt voucher number '{nextNo}' already exists.", 409);
                entity.ReceiptNo = nextNo;
            }

            // Reverse prior bank credit if previously Completed
            var oldStatus = NormalizeStatus(entity.Status);
            var oldFinal = GetEffectiveReceiptTotal(entity);
            if (oldStatus == "Completed")
            {
                var oldBank = await ResolveBankAccountAsync(entity.BankAccountId, entity.BankAccount);
                if (oldBank != null)
                {
                    oldBank.CurrentBalance = Math.Round(oldBank.CurrentBalance - oldFinal, 2);
                    oldBank.UpdatedAt = DateTime.UtcNow;
                }
            }

            var amount = Math.Round(dto.Amount, 2);
            var discount = Math.Max(0m, Math.Round(dto.Discount, 2));
            var otherCharges = Math.Max(0m, Math.Round(dto.OtherCharges, 2));
            var newFinal = ComputeReceiptTotal(amount, discount, otherCharges);

            var purpose = FirstNonEmpty(dto.Purpose, entity.Purpose);
            var payerName = FirstNonEmpty(dto.PayerName, dto.From, entity.From);
            var mode = FirstNonEmpty(dto.CollectionMode, dto.PaymentMode, entity.PaymentMode);
            var refNo = FirstNonEmpty(dto.RefNo, dto.Reference, string.Empty);

            var newBank = await ResolveBankAccountAsync(dto.BankAccountId, dto.BankAccount ?? entity.BankAccount);
            var bankAccountName = !string.IsNullOrWhiteSpace(dto.BankAccount)
                ? dto.BankAccount.Trim()
                : (newBank != null ? newBank.AccountName : entity.BankAccount);

            entity.Date = dto.ReceiptDate ?? dto.Date ?? entity.Date;
            entity.From = payerName;
            entity.Purpose = purpose;
            entity.Category = FirstNonEmpty(dto.Category, purpose);
            entity.PayerType = FirstNonEmpty(dto.PayerType, entity.PayerType);
            entity.ContactInfo = dto.ContactInfo?.Trim();
            entity.Farm = dto.Farm?.Trim();
            entity.FieldParcel = dto.FieldParcel?.Trim();
            entity.Crop = dto.Crop?.Trim();
            entity.Season = dto.Season?.Trim();
            entity.RefType = FirstNonEmpty(dto.RefType, entity.RefType);
            entity.Reference = string.IsNullOrWhiteSpace(refNo) ? null : refNo;
            entity.OriginalAmount = dto.OriginalAmount.HasValue && dto.OriginalAmount.Value > 0
                ? Math.Round(dto.OriginalAmount.Value, 2)
                : amount;
            entity.OutstandingAmount = Math.Max(0m, Math.Round(dto.OutstandingAmount ?? entity.OutstandingAmount, 2));
            entity.Amount = amount;
            entity.Discount = discount;
            entity.OtherCharges = otherCharges;
            entity.FinalAmount = newFinal;
            entity.PaymentMode = mode;
            entity.BankAccountId = newBank?.Id ?? dto.BankAccountId;
            entity.BankAccount = bankAccountName;
            entity.TransactionRef = dto.TransactionRef?.Trim();
            entity.ChequeNo = dto.ChequeNo?.Trim();
            entity.ChequeDate = dto.ChequeDate;
            entity.BuyerId = dto.BuyerId ?? entity.BuyerId;
            entity.SaleId = dto.SaleId ?? entity.SaleId;
            entity.Remarks = dto.Remarks?.Trim();
            entity.Status = newStatus;
            entity.CancelledAt = newStatus == "Cancelled" ? (entity.CancelledAt ?? DateTime.UtcNow) : null;
            if (newStatus != "Cancelled") entity.CancellationReason = null;
            entity.UpdatedAt = DateTime.UtcNow;

            if (newStatus == "Completed" && newBank != null)
            {
                newBank.CurrentBalance = Math.Round(newBank.CurrentBalance + newFinal, 2);
                newBank.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            await TryAuditAsync(actor, "UPDATE", "FinanceReceipt", entity.ReceiptNo,
                $"Payer={entity.From}; FinalAmount={entity.FinalAmount:0.00}; Status={entity.Status}",
                ipAddress);

            return FinanceServiceResult<FinanceReceiptResponseDto>.Ok(MapReceipt(entity));
        }

        public async Task<FinanceServiceResult<FinanceReceiptResponseDto>> UpdateReceiptStatusAsync(
            int id,
            UpdateTransactionStatusDto dto,
            ClaimsPrincipal? actor,
            string? ipAddress)
        {
            var entity = await _context.FinanceReceipts.FirstOrDefaultAsync(r => r.Id == id);
            if (entity == null)
                return FinanceServiceResult<FinanceReceiptResponseDto>.Fail($"Receipt with ID {id} was not found.", 404);

            var newStatus = NormalizeStatus(dto.Status);
            if (!AllowedStatuses.Contains(newStatus))
                return FinanceServiceResult<FinanceReceiptResponseDto>.Fail($"Invalid receipt status '{dto.Status}'. Allowed values: Completed, Pending, Processing, Failed, Cancelled.", 400);

            var oldStatus = NormalizeStatus(entity.Status);
            var effectiveFinal = GetEffectiveReceiptTotal(entity);

            if (oldStatus != newStatus)
            {
                var bank = await ResolveBankAccountAsync(entity.BankAccountId, entity.BankAccount);
                if (bank != null)
                {
                    if (oldStatus == "Completed")
                        bank.CurrentBalance = Math.Round(bank.CurrentBalance - effectiveFinal, 2);
                    if (newStatus == "Completed")
                        bank.CurrentBalance = Math.Round(bank.CurrentBalance + effectiveFinal, 2);
                    bank.UpdatedAt = DateTime.UtcNow;
                }
            }

            entity.Status = newStatus;
            if (newStatus == "Cancelled")
            {
                entity.CancellationReason = string.IsNullOrWhiteSpace(dto.Reason) ? "Receipt cancelled or reversed" : dto.Reason.Trim();
                entity.CancelledAt = DateTime.UtcNow;
                if (!string.IsNullOrWhiteSpace(dto.Reason))
                    entity.Remarks = dto.Reason.Trim();
            }
            else
            {
                entity.CancellationReason = null;
                entity.CancelledAt = null;
            }
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await TryAuditAsync(actor, "STATUS_CHANGE", "FinanceReceipt", entity.ReceiptNo,
                $"OldStatus={oldStatus}; NewStatus={newStatus}; Reason={dto.Reason}",
                ipAddress);

            return FinanceServiceResult<FinanceReceiptResponseDto>.Ok(MapReceipt(entity));
        }

        public Task<FinanceServiceResult<FinanceReceiptResponseDto>> CancelReceiptAsync(
            int id,
            CancelTransactionDto? dto,
            ClaimsPrincipal? actor,
            string? ipAddress)
        {
            var reason = string.IsNullOrWhiteSpace(dto?.Reason)
                ? "Receipt cancelled or reversed"
                : dto!.Reason!.Trim();

            return UpdateReceiptStatusAsync(id, new UpdateTransactionStatusDto
            {
                Status = "Cancelled",
                Reason = reason
            }, actor, ipAddress);
        }

        public async Task<FinanceServiceResult<bool>> DeleteReceiptAsync(int id, ClaimsPrincipal? actor, string? ipAddress)
        {
            var entity = await _context.FinanceReceipts.FirstOrDefaultAsync(r => r.Id == id);
            if (entity == null)
                return FinanceServiceResult<bool>.Fail($"Receipt with ID {id} was not found.", 404);

            if (NormalizeStatus(entity.Status) == "Completed")
            {
                var bank = await ResolveBankAccountAsync(entity.BankAccountId, entity.BankAccount);
                if (bank != null)
                {
                    bank.CurrentBalance = Math.Round(bank.CurrentBalance - GetEffectiveReceiptTotal(entity), 2);
                    bank.UpdatedAt = DateTime.UtcNow;
                }
            }

            var receiptNo = entity.ReceiptNo;
            var finalAmt = GetEffectiveReceiptTotal(entity);

            _context.FinanceReceipts.Remove(entity);
            await _context.SaveChangesAsync();

            await TryAuditAsync(actor, "DELETE", "FinanceReceipt", receiptNo,
                $"Deleted receipt {receiptNo} (FinalAmount={finalAmt:0.00})",
                ipAddress);

            return FinanceServiceResult<bool>.Ok(true);
        }

        // ══════════════════════════════════════════════════════════════════════
        // QUERY BUILDERS, MAPPERS & HELPERS
        // ══════════════════════════════════════════════════════════════════════

        private IQueryable<FinancePayment> BuildPaymentQuery(PaymentQueryParameters parameters)
        {
            var query = _context.FinancePayments.AsNoTracking().AsQueryable();

            var purpose = FirstNonEmpty(parameters.Purpose, parameters.PaymentType, string.Empty);
            if (!string.IsNullOrWhiteSpace(purpose) &&
                !purpose.Equals("All", StringComparison.OrdinalIgnoreCase) &&
                !purpose.Equals("All Purposes", StringComparison.OrdinalIgnoreCase))
            {
                var pLower = purpose.ToLower();
                query = query.Where(p => p.Purpose.ToLower() == pLower || p.PaymentType.ToLower() == pLower);
            }

            if (!string.IsNullOrWhiteSpace(parameters.PayeeType) &&
                !parameters.PayeeType.Equals("All", StringComparison.OrdinalIgnoreCase) &&
                !parameters.PayeeType.Equals("All Payees", StringComparison.OrdinalIgnoreCase))
            {
                var ptLower = parameters.PayeeType.Trim().ToLower();
                query = query.Where(p => p.PayeeType.ToLower() == ptLower);
            }

            if (!string.IsNullOrWhiteSpace(parameters.PaymentMode) &&
                !parameters.PaymentMode.Equals("All", StringComparison.OrdinalIgnoreCase) &&
                !parameters.PaymentMode.Equals("All Modes", StringComparison.OrdinalIgnoreCase))
            {
                var modeLower = parameters.PaymentMode.Trim().ToLower();
                query = query.Where(p => p.PaymentMode.ToLower() == modeLower);
            }

            if (!string.IsNullOrWhiteSpace(parameters.Status) &&
                !parameters.Status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                var statusLower = parameters.Status.Trim().ToLower();
                query = query.Where(p => p.Status.ToLower() == statusLower);
            }

            if (!string.IsNullOrWhiteSpace(parameters.Farm))
            {
                var fLower = parameters.Farm.Trim().ToLower();
                query = query.Where(p => p.Farm != null && p.Farm.ToLower().Contains(fLower));
            }

            if (!string.IsNullOrWhiteSpace(parameters.Crop))
            {
                var cLower = parameters.Crop.Trim().ToLower();
                query = query.Where(p => p.Crop != null && p.Crop.ToLower().Contains(cLower));
            }

            if (!string.IsNullOrWhiteSpace(parameters.Season))
            {
                var sLower = parameters.Season.Trim().ToLower();
                query = query.Where(p => p.Season != null && p.Season.ToLower() == sLower);
            }

            var fromDate = parameters.StartDate ?? parameters.FromDate;
            var toDate = parameters.EndDate ?? parameters.ToDate;

            if (fromDate.HasValue)
                query = query.Where(p => p.Date >= fromDate.Value.Date);

            if (toDate.HasValue)
            {
                var endExclusive = toDate.Value.Date.AddDays(1);
                query = query.Where(p => p.Date < endExclusive);
            }

            if (!string.IsNullOrWhiteSpace(parameters.Search))
            {
                var q = parameters.Search.Trim().ToLower();
                query = query.Where(p =>
                    p.PaymentNo.ToLower().Contains(q) ||
                    p.Party.ToLower().Contains(q) ||
                    p.Purpose.ToLower().Contains(q) ||
                    p.Category.ToLower().Contains(q) ||
                    (p.ReferenceTransaction != null && p.ReferenceTransaction.ToLower().Contains(q)) ||
                    (p.ReferenceNo != null && p.ReferenceNo.ToLower().Contains(q)) ||
                    (p.ChequeNo != null && p.ChequeNo.ToLower().Contains(q)) ||
                    (p.Remarks != null && p.Remarks.ToLower().Contains(q)));
            }

            return query;
        }

        private static IQueryable<FinancePayment> ApplyPaymentSorting(IQueryable<FinancePayment> query, string? sortBy, bool desc)
        {
            return (sortBy ?? "date").Trim().ToLowerInvariant() switch
            {
                "amount" or "totalamount" => desc ? query.OrderByDescending(p => p.TotalAmount).ThenByDescending(p => p.Id) : query.OrderBy(p => p.TotalAmount).ThenBy(p => p.Id),
                "paymentno" => desc ? query.OrderByDescending(p => p.PaymentNo) : query.OrderBy(p => p.PaymentNo),
                "payee" or "party" => desc ? query.OrderByDescending(p => p.Party) : query.OrderBy(p => p.Party),
                "status" => desc ? query.OrderByDescending(p => p.Status) : query.OrderBy(p => p.Status),
                _ => desc ? query.OrderByDescending(p => p.Date).ThenByDescending(p => p.Id) : query.OrderBy(p => p.Date).ThenBy(p => p.Id)
            };
        }

        private IQueryable<FinanceReceipt> BuildReceiptQuery(ReceiptQueryParameters parameters)
        {
            var query = _context.FinanceReceipts.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(parameters.Purpose) &&
                !parameters.Purpose.Equals("All", StringComparison.OrdinalIgnoreCase) &&
                !parameters.Purpose.Equals("All Purposes", StringComparison.OrdinalIgnoreCase))
            {
                var pLower = parameters.Purpose.Trim().ToLower();
                query = query.Where(r => r.Purpose.ToLower() == pLower);
            }

            if (!string.IsNullOrWhiteSpace(parameters.PayerType) &&
                !parameters.PayerType.Equals("All", StringComparison.OrdinalIgnoreCase) &&
                !parameters.PayerType.Equals("All Payers", StringComparison.OrdinalIgnoreCase))
            {
                var ptLower = parameters.PayerType.Trim().ToLower();
                query = query.Where(r => r.PayerType.ToLower() == ptLower);
            }

            var mode = FirstNonEmpty(parameters.CollectionMode, parameters.PaymentMode, string.Empty);
            if (!string.IsNullOrWhiteSpace(mode) &&
                !mode.Equals("All", StringComparison.OrdinalIgnoreCase) &&
                !mode.Equals("All Modes", StringComparison.OrdinalIgnoreCase))
            {
                var mLower = mode.ToLower();
                query = query.Where(r => r.PaymentMode.ToLower() == mLower);
            }

            if (!string.IsNullOrWhiteSpace(parameters.Status) &&
                !parameters.Status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                var sLower = parameters.Status.Trim().ToLower();
                query = query.Where(r => r.Status.ToLower() == sLower);
            }

            if (!string.IsNullOrWhiteSpace(parameters.Farm))
            {
                var fLower = parameters.Farm.Trim().ToLower();
                query = query.Where(r => r.Farm != null && r.Farm.ToLower().Contains(fLower));
            }

            if (!string.IsNullOrWhiteSpace(parameters.Crop))
            {
                var cLower = parameters.Crop.Trim().ToLower();
                query = query.Where(r => r.Crop != null && r.Crop.ToLower().Contains(cLower));
            }

            if (!string.IsNullOrWhiteSpace(parameters.Season))
            {
                var sLower = parameters.Season.Trim().ToLower();
                query = query.Where(r => r.Season != null && r.Season.ToLower() == sLower);
            }

            var fromDate = parameters.StartDate ?? parameters.FromDate;
            var toDate = parameters.EndDate ?? parameters.ToDate;

            if (fromDate.HasValue)
                query = query.Where(r => r.Date >= fromDate.Value.Date);

            if (toDate.HasValue)
            {
                var endExclusive = toDate.Value.Date.AddDays(1);
                query = query.Where(r => r.Date < endExclusive);
            }

            if (!string.IsNullOrWhiteSpace(parameters.Search))
            {
                var q = parameters.Search.Trim().ToLower();
                query = query.Where(r =>
                    r.ReceiptNo.ToLower().Contains(q) ||
                    r.From.ToLower().Contains(q) ||
                    r.Purpose.ToLower().Contains(q) ||
                    r.Category.ToLower().Contains(q) ||
                    (r.Reference != null && r.Reference.ToLower().Contains(q)) ||
                    (r.TransactionRef != null && r.TransactionRef.ToLower().Contains(q)) ||
                    (r.ChequeNo != null && r.ChequeNo.ToLower().Contains(q)) ||
                    (r.Remarks != null && r.Remarks.ToLower().Contains(q)));
            }

            return query;
        }

        private static IQueryable<FinanceReceipt> ApplyReceiptSorting(IQueryable<FinanceReceipt> query, string? sortBy, bool desc)
        {
            return (sortBy ?? "date").Trim().ToLowerInvariant() switch
            {
                "amount" or "finalamount" => desc ? query.OrderByDescending(r => r.FinalAmount).ThenByDescending(r => r.Id) : query.OrderBy(r => r.FinalAmount).ThenBy(r => r.Id),
                "receiptno" => desc ? query.OrderByDescending(r => r.ReceiptNo) : query.OrderBy(r => r.ReceiptNo),
                "payer" or "from" => desc ? query.OrderByDescending(r => r.From) : query.OrderBy(r => r.From),
                "status" => desc ? query.OrderByDescending(r => r.Status) : query.OrderBy(r => r.Status),
                _ => desc ? query.OrderByDescending(r => r.Date).ThenByDescending(r => r.Id) : query.OrderBy(r => r.Date).ThenBy(r => r.Id)
            };
        }

        private static string? ValidatePaymentInput(CreateFinancePaymentDto dto)
        {
            if (dto.Amount <= 0)
                return "Payment amount must be greater than zero.";
            if (string.IsNullOrWhiteSpace(dto.PayeeName) && string.IsNullOrWhiteSpace(dto.Party))
                return "Payee name (Party) is required.";
            var mode = FirstNonEmpty(dto.PaymentMode, "Bank Transfer");
            if (mode.Equals("Cheque", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(dto.ChequeNo))
                return "Cheque number is required when Payment Mode is Cheque.";
            return null;
        }

        private static string? ValidateReceiptInput(CreateFinanceReceiptDto dto)
        {
            if (dto.Amount <= 0)
                return "Receipt amount must be greater than zero.";
            if (string.IsNullOrWhiteSpace(dto.PayerName) && string.IsNullOrWhiteSpace(dto.From))
                return "Customer / Payer name (From) is required.";
            var mode = FirstNonEmpty(dto.CollectionMode, dto.PaymentMode, "Bank Transfer");
            if (mode.Equals("Cheque", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(dto.ChequeNo))
                return "Cheque number is required when Collection Mode is Cheque.";
            return null;
        }

        private async Task<BankAccount?> ResolveBankAccountAsync(int? bankAccountId, string? bankAccountName)
        {
            if (bankAccountId.HasValue && bankAccountId.Value > 0)
            {
                var byId = await _context.BankAccounts.FirstOrDefaultAsync(b => b.Id == bankAccountId.Value);
                if (byId != null) return byId;
            }

            if (!string.IsNullOrWhiteSpace(bankAccountName))
            {
                var name = bankAccountName.Trim().ToLower();
                return await _context.BankAccounts.FirstOrDefaultAsync(b =>
                    b.AccountName.ToLower() == name ||
                    b.BankName.ToLower() == name ||
                    (b.BankName + " - " + b.AccountName).ToLower() == name);
            }

            return null;
        }

        private static decimal ComputePaymentTotal(decimal amount, decimal additionalCharges, decimal discount) =>
            Math.Max(0m, Math.Round(amount + additionalCharges - discount, 2));

        private static decimal ComputeReceiptTotal(decimal amount, decimal discount, decimal otherCharges) =>
            Math.Max(0m, Math.Round(amount - discount + otherCharges, 2));

        private static decimal GetEffectivePaymentTotal(FinancePayment p) =>
            p.TotalAmount > 0 ? p.TotalAmount : ComputePaymentTotal(p.Amount, p.AdditionalCharges, p.Discount);

        private static decimal GetEffectiveReceiptTotal(FinanceReceipt r) =>
            r.FinalAmount > 0 ? r.FinalAmount : ComputeReceiptTotal(r.Amount, r.Discount, r.OtherCharges);

        private static string NormalizeStatus(string? raw)
        {
            var s = (raw ?? "Completed").Trim();
            return s.ToLowerInvariant() switch
            {
                "completed" or "paid" or "received" or "success" => "Completed",
                "pending" => "Pending",
                "processing" => "Processing",
                "failed" => "Failed",
                "cancelled" or "canceled" => "Cancelled",
                _ => s
            };
        }

        private static string FirstNonEmpty(params string?[] candidates)
        {
            foreach (var c in candidates)
            {
                if (!string.IsNullOrWhiteSpace(c))
                    return c.Trim();
            }
            return string.Empty;
        }

        private static FinancePaymentResponseDto MapPayment(FinancePayment p)
        {
            var total = GetEffectivePaymentTotal(p);
            var status = NormalizeStatus(p.Status);
            var purpose = FirstNonEmpty(p.Purpose, p.PaymentType, "Operational Expense");

            return new FinancePaymentResponseDto
            {
                Id = p.Id,
                PaymentNo = p.PaymentNo,
                Date = p.Date,
                PaymentDate = p.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                PaymentDateDisplay = p.Date.ToString("dd MMM yyyy", CultureInfo.InvariantCulture),
                Purpose = purpose,
                PaymentType = FirstNonEmpty(p.PaymentType, purpose),
                Category = FirstNonEmpty(p.Category, purpose),
                PayeeType = FirstNonEmpty(p.PayeeType, "Supplier / Vendor"),
                PayeeName = p.Party,
                Party = p.Party,
                ContactInfo = p.ContactInfo ?? string.Empty,
                Farm = p.Farm ?? string.Empty,
                FieldParcel = p.FieldParcel ?? string.Empty,
                Crop = p.Crop ?? string.Empty,
                Season = p.Season ?? string.Empty,
                RefType = FirstNonEmpty(p.RefType, string.IsNullOrWhiteSpace(p.ReferenceTransaction) ? "None" : "Expense"),
                RefNo = p.ReferenceTransaction ?? string.Empty,
                ReferenceTransaction = p.ReferenceTransaction,
                OriginalAmount = p.OriginalAmount > 0 ? p.OriginalAmount : p.Amount,
                OutstandingAmount = p.OutstandingAmount,
                Amount = p.Amount,
                AdditionalCharges = p.AdditionalCharges,
                Discount = p.Discount,
                TotalAmount = total,
                PaymentMode = p.PaymentMode,
                BankAccountId = p.BankAccountId,
                BankAccount = p.BankAccount,
                TransactionRef = p.ReferenceNo ?? string.Empty,
                ReferenceNo = p.ReferenceNo,
                ChequeNo = p.ChequeNo ?? string.Empty,
                ChequeDate = p.ChequeDate.HasValue ? p.ChequeDate.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) : string.Empty,
                SupplierId = p.SupplierId,
                LabourId = p.LabourId,
                Remarks = p.Remarks ?? string.Empty,
                Status = status,
                CancellationReason = p.CancellationReason,
                CancelledAt = p.CancelledAt,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            };
        }

        private static FinanceReceiptResponseDto MapReceipt(FinanceReceipt r)
        {
            var finalAmt = GetEffectiveReceiptTotal(r);
            var status = NormalizeStatus(r.Status);
            var purpose = FirstNonEmpty(r.Purpose, "Crop Sales");

            return new FinanceReceiptResponseDto
            {
                Id = r.Id,
                ReceiptNo = r.ReceiptNo,
                Date = r.Date,
                ReceiptDate = r.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                ReceiptDateDisplay = r.Date.ToString("dd MMM yyyy", CultureInfo.InvariantCulture),
                Purpose = purpose,
                Category = FirstNonEmpty(r.Category, purpose),
                PayerType = FirstNonEmpty(r.PayerType, "Wholesale Buyer / Trader"),
                PayerName = r.From,
                From = r.From,
                ContactInfo = r.ContactInfo ?? string.Empty,
                Farm = r.Farm ?? string.Empty,
                FieldParcel = r.FieldParcel ?? string.Empty,
                Crop = r.Crop ?? string.Empty,
                Season = r.Season ?? string.Empty,
                RefType = FirstNonEmpty(r.RefType, string.IsNullOrWhiteSpace(r.Reference) ? "None" : "Sales Invoice"),
                RefNo = r.Reference ?? string.Empty,
                Reference = r.Reference,
                OriginalAmount = r.OriginalAmount > 0 ? r.OriginalAmount : r.Amount,
                OutstandingAmount = r.OutstandingAmount,
                Amount = r.Amount,
                Discount = r.Discount,
                OtherCharges = r.OtherCharges,
                FinalAmount = finalAmt,
                CollectionMode = r.PaymentMode,
                PaymentMode = r.PaymentMode,
                BankAccountId = r.BankAccountId,
                BankAccount = r.BankAccount,
                TransactionRef = r.TransactionRef ?? string.Empty,
                ChequeNo = r.ChequeNo ?? string.Empty,
                ChequeDate = r.ChequeDate.HasValue ? r.ChequeDate.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) : string.Empty,
                BuyerId = r.BuyerId,
                SaleId = r.SaleId,
                Remarks = r.Remarks ?? string.Empty,
                Status = status,
                CancellationReason = r.CancellationReason,
                CancelledAt = r.CancelledAt,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            };
        }

        private static void BuildGroupedPaymentReport(
            AnalyticsReportResponseDto<FinancePaymentResponseDto> response,
            string title,
            List<FinancePayment> items,
            Func<FinancePayment, string> keySelector,
            bool sortByLabelDescending = false)
        {
            var grandTotal = items.Sum(GetEffectivePaymentTotal);
            var groups = items
                .GroupBy(keySelector)
                .Select(g =>
                {
                    var total = Math.Round(g.Sum(GetEffectivePaymentTotal), 2);
                    var completed = Math.Round(g.Where(x => NormalizeStatus(x.Status) == "Completed").Sum(GetEffectivePaymentTotal), 2);
                    var pending = Math.Round(g.Where(x => NormalizeStatus(x.Status) is "Pending" or "Processing").Sum(GetEffectivePaymentTotal), 2);
                    return new AnalyticsGroupRowDto
                    {
                        Label = g.Key,
                        Count = g.Count(),
                        TotalAmount = total,
                        CompletedAmount = completed,
                        PendingAmount = pending,
                        SharePercent = grandTotal > 0 ? Math.Round((total / grandTotal) * 100m, 2) : 0m
                    };
                });

            response.ReportTitle = title;
            response.IsGrouped = true;
            response.TotalCount = items.Count;
            response.GrandTotal = Math.Round(grandTotal, 2);
            response.Groups = sortByLabelDescending
                ? groups.OrderByDescending(g => g.Label).ToList()
                : groups.OrderByDescending(g => g.TotalAmount).ToList();
        }

        private static void BuildGroupedReceiptReport(
            AnalyticsReportResponseDto<FinanceReceiptResponseDto> response,
            string title,
            List<FinanceReceipt> items,
            Func<FinanceReceipt, string> keySelector,
            bool sortByLabelDescending = false)
        {
            var grandTotal = items.Sum(GetEffectiveReceiptTotal);
            var groups = items
                .GroupBy(keySelector)
                .Select(g =>
                {
                    var total = Math.Round(g.Sum(GetEffectiveReceiptTotal), 2);
                    var completed = Math.Round(g.Where(x => NormalizeStatus(x.Status) == "Completed").Sum(GetEffectiveReceiptTotal), 2);
                    var pending = Math.Round(g.Where(x => NormalizeStatus(x.Status) is "Pending" or "Processing").Sum(GetEffectiveReceiptTotal), 2);
                    return new AnalyticsGroupRowDto
                    {
                        Label = g.Key,
                        Count = g.Count(),
                        TotalAmount = total,
                        CompletedAmount = completed,
                        PendingAmount = pending,
                        SharePercent = grandTotal > 0 ? Math.Round((total / grandTotal) * 100m, 2) : 0m
                    };
                });

            response.ReportTitle = title;
            response.IsGrouped = true;
            response.TotalCount = items.Count;
            response.GrandTotal = Math.Round(grandTotal, 2);
            response.Groups = sortByLabelDescending
                ? groups.OrderByDescending(g => g.Label).ToList()
                : groups.OrderByDescending(g => g.TotalAmount).ToList();
        }

        public static string NumberToWordsInr(decimal amount)
        {
            var abs = Math.Abs(amount);
            var rupees = (long)Math.Floor(abs);
            var paise = (int)Math.Round((abs - rupees) * 100m);

            if (rupees == 0 && paise == 0)
                return "Zero Rupees Only";

            string[] ones =
            {
                "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
                "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
            };
            string[] tens = { "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety" };

            string ConvertBelowThousand(long n)
            {
                var sb = new StringBuilder();
                if (n >= 100)
                {
                    sb.Append(ones[n / 100]).Append(" Hundred ");
                    n %= 100;
                }
                if (n >= 20)
                {
                    sb.Append(tens[n / 10]).Append(' ');
                    n %= 10;
                }
                if (n > 0)
                    sb.Append(ones[n]).Append(' ');
                return sb.ToString().Trim();
            }

            var words = new StringBuilder();
            var crore = rupees / 10000000;
            var rem = rupees % 10000000;
            var lakh = rem / 100000;
            rem %= 100000;
            var thousand = rem / 1000;
            rem %= 1000;

            if (crore > 0) words.Append(ConvertBelowThousand(crore)).Append(" Crore ");
            if (lakh > 0) words.Append(ConvertBelowThousand(lakh)).Append(" Lakh ");
            if (thousand > 0) words.Append(ConvertBelowThousand(thousand)).Append(" Thousand ");
            if (rem > 0) words.Append(ConvertBelowThousand(rem)).Append(' ');

            var result = words.Length > 0 ? $"{words.ToString().Trim()} Rupees" : string.Empty;
            if (paise > 0)
            {
                var paiseWords = ConvertBelowThousand(paise);
                result = string.IsNullOrEmpty(result)
                    ? $"{paiseWords} Paise Only"
                    : $"{result} and {paiseWords} Paise Only";
            }
            else
            {
                result += " Only";
            }

            return result;
        }

        private static string CsvEscape(string? val)
        {
            var s = val ?? string.Empty;
            return $"\"{s.Replace("\"", "\"\"")}\"";
        }

        private async Task TryAuditAsync(ClaimsPrincipal? principal, string action, string entityType, string entityId, string details, string? ipAddress)
        {
            try
            {
                var (userId, actorName) = _auditService.GetActorFromPrincipal(principal);
                await _auditService.LogActionAsync(userId, actorName, action, entityType, entityId, details, ipAddress);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Module 17 Audit] Non-fatal audit log error for {EntityType} {EntityId}", entityType, entityId);
            }
        }
    }
}
