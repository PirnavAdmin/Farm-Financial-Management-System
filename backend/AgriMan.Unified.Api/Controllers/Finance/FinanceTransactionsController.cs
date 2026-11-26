using System.Text;
using FarmManagementApi.DTOs;
using FarmManagementApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace FarmManagementApi.Controllers
{
    /// <summary>
    /// Module 17 — Outgoing Payment Management API (`finance_payments` table).
    /// Supports full CRUD, KPI summary, 12-dimension outflow analytics, printable vouchers with INR words,
    /// CSV export, status transitions, soft cancellation, bank account balance sync, and audit logging.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/payments")]
    [Produces("application/json")]
    [Tags("17. Payment & Receipt Management - Payments (Module 17)")]
    public class FinancePaymentsController : ControllerBase
    {
        private readonly IPaymentReceiptService _service;

        public FinancePaymentsController(IPaymentReceiptService service)
        {
            _service = service;
        }

        /// <summary>
        /// List outgoing payments with multi-field search, status, purpose, payee type, mode, farm, crop, season, date range, sorting, and optional pagination.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(List<FinancePaymentResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<FinancePaymentResponseDto>>> GetPayments([FromQuery] PaymentQueryParameters parameters)
        {
            var list = await _service.GetPaymentsAsync(parameters);
            return Ok(list);
        }

        /// <summary>
        /// Get KPI summary metrics for payments (Total Payments, Successfully Paid, Pending Outflows, This Month, and status counts).
        /// </summary>
        [HttpGet("summary")]
        [ProducesResponseType(typeof(PaymentSummaryDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<PaymentSummaryDto>> GetSummary([FromQuery] PaymentQueryParameters parameters)
        {
            var summary = await _service.GetPaymentSummaryAsync(parameters);
            return Ok(summary);
        }

        /// <summary>
        /// Get next auto-generated sequential Payment Voucher number (PAY-YYYY-NNNN).
        /// </summary>
        [HttpGet("next-number")]
        [ProducesResponseType(typeof(NextNumberDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<NextNumberDto>> GetNextNumber()
        {
            var nextNo = await _service.GetNextPaymentNoAsync();
            return Ok(new NextNumberDto { NextNumber = nextNo });
        }

        /// <summary>
        /// Generate outflow analytics reports. Supported report types: summary, by-purpose, by-payee, by-payee-type,
        /// by-mode, by-farm, by-crop, monthly-outflow, seasonal-outflow, pending-disbursements, cheques-issued, top-disbursements.
        /// </summary>
        [HttpGet("reports/{reportType}")]
        [ProducesResponseType(typeof(AnalyticsReportResponseDto<FinancePaymentResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<AnalyticsReportResponseDto<FinancePaymentResponseDto>>> GetReport(
            string reportType,
            [FromQuery] PaymentQueryParameters parameters)
        {
            var report = await _service.GetPaymentReportAsync(reportType, parameters);
            return Ok(report);
        }

        /// <summary>
        /// Export filtered payment records as a downloadable CSV file.
        /// </summary>
        [HttpGet("export/csv")]
        [Produces("text/csv")]
        public async Task<IActionResult> ExportCsv([FromQuery] PaymentQueryParameters parameters)
        {
            var csv = await _service.ExportPaymentsCsvAsync(parameters);
            var bytes = Encoding.UTF8.GetBytes(csv);
            var fileName = $"agriman_payments_{DateTime.UtcNow:yyyy-MM-dd}.csv";
            return File(bytes, "text/csv; charset=utf-8", fileName);
        }

        /// <summary>
        /// Get a single payment record by ID.
        /// </summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(FinancePaymentResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<FinancePaymentResponseDto>> GetPayment(int id)
        {
            var payment = await _service.GetPaymentByIdAsync(id);
            if (payment == null)
                return NotFound(new { message = $"Payment with ID {id} was not found." });
            return Ok(payment);
        }

        /// <summary>
        /// Get official Payment Voucher payload including Indian Rupee amount-in-words.
        /// </summary>
        [HttpGet("{id:int}/voucher")]
        [ProducesResponseType(typeof(PaymentVoucherDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PaymentVoucherDto>> GetVoucher(int id)
        {
            var result = await _service.GetPaymentVoucherAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
            return Ok(result.Data);
        }

        /// <summary>
        /// Record a new outgoing payment. Completed payments automatically debit the linked bank/cash account.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(FinancePaymentResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<FinancePaymentResponseDto>> CreatePayment([FromBody] CreateFinancePaymentDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            var result = await _service.CreatePaymentAsync(dto, User, ip);
            if (!result.Success)
                return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

            return CreatedAtAction(nameof(GetPayment), new { id = result.Data!.Id }, result.Data);
        }

        /// <summary>
        /// Update an existing payment record and synchronize bank balance deltas.
        /// </summary>
        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(FinancePaymentResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<FinancePaymentResponseDto>> UpdatePayment(int id, [FromBody] UpdateFinancePaymentDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (dto.Id.HasValue && dto.Id.Value != 0 && dto.Id.Value != id)
                return BadRequest(new { message = "Route ID does not match payload ID." });

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            var result = await _service.UpdatePaymentAsync(id, dto, User, ip);
            if (!result.Success)
                return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        /// <summary>
        /// Transition payment status (Completed, Pending, Processing, Failed, Cancelled) with bank balance sync.
        /// </summary>
        [HttpPatch("{id:int}/status")]
        [ProducesResponseType(typeof(FinancePaymentResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<FinancePaymentResponseDto>> UpdateStatus(int id, [FromBody] UpdateTransactionStatusDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            var result = await _service.UpdatePaymentStatusAsync(id, dto, User, ip);
            if (!result.Success)
                return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        /// <summary>
        /// Soft-cancel a payment with a cancellation reason, reversing any completed bank debit while preserving the audit trail.
        /// </summary>
        [HttpPost("{id:int}/cancel")]
        [ProducesResponseType(typeof(FinancePaymentResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<FinancePaymentResponseDto>> CancelPayment(int id, [FromBody] CancelTransactionDto? dto)
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            var result = await _service.CancelPaymentAsync(id, dto, User, ip);
            if (!result.Success)
                return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        /// <summary>
        /// Permanently delete a payment record and reverse any completed bank debit.
        /// </summary>
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeletePayment(int id)
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            var result = await _service.DeletePaymentAsync(id, User, ip);
            if (!result.Success)
                return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

            return NoContent();
        }
    }

    /// <summary>
    /// Module 17 — Incoming Receipt / Collection Management API (`finance_receipts` table).
    /// Supports full CRUD, KPI summary, 12-dimension collection analytics, official receipt vouchers with INR words,
    /// CSV export, status transitions, soft cancellation, bank account balance sync, and audit logging.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/receipts")]
    [Produces("application/json")]
    [Tags("17. Payment & Receipt Management - Receipts (Module 17)")]
    public class FinanceReceiptsController : ControllerBase
    {
        private readonly IPaymentReceiptService _service;

        public FinanceReceiptsController(IPaymentReceiptService service)
        {
            _service = service;
        }

        /// <summary>
        /// List incoming receipts with multi-field search, status, purpose, payer type, collection mode, farm, crop, season, date range, sorting, and optional pagination.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(List<FinanceReceiptResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<FinanceReceiptResponseDto>>> GetReceipts([FromQuery] ReceiptQueryParameters parameters)
        {
            var list = await _service.GetReceiptsAsync(parameters);
            return Ok(list);
        }

        /// <summary>
        /// Get KPI summary metrics for receipts (Total Receipts, Total Received, Pending Receivables, This Month, and status counts).
        /// </summary>
        [HttpGet("summary")]
        [ProducesResponseType(typeof(ReceiptSummaryDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReceiptSummaryDto>> GetSummary([FromQuery] ReceiptQueryParameters parameters)
        {
            var summary = await _service.GetReceiptSummaryAsync(parameters);
            return Ok(summary);
        }

        /// <summary>
        /// Get next auto-generated sequential Receipt Voucher number (REC-YYYY-NNNN).
        /// </summary>
        [HttpGet("next-number")]
        [ProducesResponseType(typeof(NextNumberDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<NextNumberDto>> GetNextNumber()
        {
            var nextNo = await _service.GetNextReceiptNoAsync();
            return Ok(new NextNumberDto { NextNumber = nextNo });
        }

        /// <summary>
        /// Generate collection analytics reports. Supported report types: summary, by-purpose, by-payer, by-payer-type,
        /// by-mode, by-farm, by-crop, monthly-receipts, seasonal-receipts, pending-receivables, cheques-register, top-collections.
        /// </summary>
        [HttpGet("reports/{reportType}")]
        [ProducesResponseType(typeof(AnalyticsReportResponseDto<FinanceReceiptResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<AnalyticsReportResponseDto<FinanceReceiptResponseDto>>> GetReport(
            string reportType,
            [FromQuery] ReceiptQueryParameters parameters)
        {
            var report = await _service.GetReceiptReportAsync(reportType, parameters);
            return Ok(report);
        }

        /// <summary>
        /// Export filtered receipt records as a downloadable CSV file.
        /// </summary>
        [HttpGet("export/csv")]
        [Produces("text/csv")]
        public async Task<IActionResult> ExportCsv([FromQuery] ReceiptQueryParameters parameters)
        {
            var csv = await _service.ExportReceiptsCsvAsync(parameters);
            var bytes = Encoding.UTF8.GetBytes(csv);
            var fileName = $"agriman_receipts_{DateTime.UtcNow:yyyy-MM-dd}.csv";
            return File(bytes, "text/csv; charset=utf-8", fileName);
        }

        /// <summary>
        /// Get a single receipt record by ID.
        /// </summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(FinanceReceiptResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<FinanceReceiptResponseDto>> GetReceipt(int id)
        {
            var receipt = await _service.GetReceiptByIdAsync(id);
            if (receipt == null)
                return NotFound(new { message = $"Receipt with ID {id} was not found." });
            return Ok(receipt);
        }

        /// <summary>
        /// Get official Receipt Voucher payload including Indian Rupee amount-in-words.
        /// </summary>
        [HttpGet("{id:int}/voucher")]
        [ProducesResponseType(typeof(ReceiptVoucherDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ReceiptVoucherDto>> GetVoucher(int id)
        {
            var result = await _service.GetReceiptVoucherAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
            return Ok(result.Data);
        }

        /// <summary>
        /// Record a new incoming receipt. Completed receipts automatically credit the linked bank/cash account.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(FinanceReceiptResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<FinanceReceiptResponseDto>> CreateReceipt([FromBody] CreateFinanceReceiptDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            var result = await _service.CreateReceiptAsync(dto, User, ip);
            if (!result.Success)
                return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

            return CreatedAtAction(nameof(GetReceipt), new { id = result.Data!.Id }, result.Data);
        }

        /// <summary>
        /// Update an existing receipt record and synchronize bank balance deltas.
        /// </summary>
        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(FinanceReceiptResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<FinanceReceiptResponseDto>> UpdateReceipt(int id, [FromBody] UpdateFinanceReceiptDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (dto.Id.HasValue && dto.Id.Value != 0 && dto.Id.Value != id)
                return BadRequest(new { message = "Route ID does not match payload ID." });

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            var result = await _service.UpdateReceiptAsync(id, dto, User, ip);
            if (!result.Success)
                return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        /// <summary>
        /// Transition receipt status (Completed, Pending, Processing, Failed, Cancelled) with bank balance sync.
        /// </summary>
        [HttpPatch("{id:int}/status")]
        [ProducesResponseType(typeof(FinanceReceiptResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<FinanceReceiptResponseDto>> UpdateStatus(int id, [FromBody] UpdateTransactionStatusDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            var result = await _service.UpdateReceiptStatusAsync(id, dto, User, ip);
            if (!result.Success)
                return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        /// <summary>
        /// Soft-cancel a receipt with a cancellation reason, reversing any completed bank credit while preserving the audit trail.
        /// </summary>
        [HttpPost("{id:int}/cancel")]
        [ProducesResponseType(typeof(FinanceReceiptResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<FinanceReceiptResponseDto>> CancelReceipt(int id, [FromBody] CancelTransactionDto? dto)
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            var result = await _service.CancelReceiptAsync(id, dto, User, ip);
            if (!result.Success)
                return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        /// <summary>
        /// Permanently delete a receipt record and reverse any completed bank credit.
        /// </summary>
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteReceipt(int id)
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            var result = await _service.DeleteReceiptAsync(id, User, ip);
            if (!result.Success)
                return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

            return NoContent();
        }
    }
}
