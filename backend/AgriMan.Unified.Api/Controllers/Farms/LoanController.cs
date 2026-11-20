using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmManagementApi.Data;
using FarmManagementApi.DTOs;
using FarmManagementApi.Models;
using FarmManagementApi.Services;

namespace FarmManagementApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/Loans")]
    [Tags("14. Loan & Finance (Module 14)")]
    public class LoanController : ControllerBase
    {
        private readonly FarmDbContext _context;
        private readonly IWebHostEnvironment _env;

        public LoanController(FarmDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // =========================================================================
        // 1. LOAN LIST & OVERVIEW
        // =========================================================================

        // GET: api/Loan
        [HttpGet]
        public async Task<IActionResult> GetLoans(
            [FromQuery] string? search,
            [FromQuery] string? status,
            [FromQuery] string? loanType,
            [FromQuery] string? bank)
        {
            var query = _context.Loans
                .Include(l => l.Disbursements)
                .Include(l => l.Payments)
                .Include(l => l.Installments)
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(l => l.LoanNo.ToLower().Contains(s) ||
                                         (l.LoanAccountNo != null && l.LoanAccountNo.ToLower().Contains(s)) ||
                                         l.BankLender.ToLower().Contains(s) ||
                                         l.LoanType.ToLower().Contains(s) ||
                                         (l.Remarks != null && l.Remarks.ToLower().Contains(s)));
            }

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(l => l.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(loanType) && !loanType.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(l => l.LoanType == loanType);
            }

            if (!string.IsNullOrWhiteSpace(bank) && !bank.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(l => l.BankLender == bank);
            }

            var list = await query.OrderByDescending(l => l.CreatedAt).ToListAsync();

            var result = list.Select(l =>
            {
                var principalPaid = l.Payments.Sum(p => p.Principal);
                var interestPaid = l.Payments.Sum(p => p.Interest);
                var totalPaid = l.Payments.Sum(p => p.TotalPayment);

                return new
                {
                    loanId = l.Id,
                    loanNo = l.LoanNo,
                    loanAccountNo = l.LoanAccountNo,
                    bankLender = l.BankLender,
                    bankName = l.BankLender,
                    loanType = l.LoanType,
                    loanPurpose = l.LoanPurpose,
                    sanctionAmount = l.SanctionAmount,
                    disbursedAmount = l.DisbursedAmount,
                    outstandingAmount = l.OutstandingPrincipal,
                    outstandingPrincipal = l.OutstandingPrincipal,
                    interestRate = l.InterestRate,
                    interestType = l.InterestType,
                    tenureMonths = l.TenureMonths,
                    repaymentFrequency = l.RepaymentFrequency,
                    emi = l.EmiAmount,
                    emiAmount = l.EmiAmount,
                    startDate = l.StartDate,
                    endDate = l.EndDate,
                    nextEmiDueDate = l.NextEmiDueDate,
                    processingFees = l.ProcessingFees,
                    status = l.Status,
                    remarks = l.Remarks,
                    closedDate = l.ClosedDate,
                    totalPaid,
                    principalPaid,
                    interestPaid,
                    disbursementsCount = l.Disbursements.Count,
                    installmentsCount = l.Installments.Count,
                    paymentsCount = l.Payments.Count
                };
            });

            return Ok(result);
        }

        // GET: api/Loan/summary
        [HttpGet("summary")]
        public async Task<ActionResult<LoanSummaryDto>> GetSummary()
        {
            var loans = await _context.Loans
                .Include(l => l.Payments)
                .Include(l => l.Installments)
                .AsNoTracking()
                .ToListAsync();

            var today = DateTime.UtcNow.Date;

            var activeLoans = loans.Count(l => l.Status == "Active");
            var totalSanctioned = loans.Sum(l => l.SanctionAmount);
            var totalDisbursed = loans.Sum(l => l.DisbursedAmount);
            var totalOutstanding = loans.Sum(l => l.OutstandingPrincipal);

            var allPayments = loans.SelectMany(l => l.Payments).ToList();
            var totalAmountPaid = allPayments.Sum(p => p.TotalPayment);
            var totalPrincipalPaid = allPayments.Sum(p => p.Principal);
            var totalInterestPaid = allPayments.Sum(p => p.Interest + p.Penalty);

            var allInstallments = loans.SelectMany(l => l.Installments).ToList();
            var upcomingCount = allInstallments.Count(i => i.Status != "Paid" && i.DueDate >= today && i.DueDate <= today.AddDays(30));
            var overdueCount = allInstallments.Count(i => i.Status == "Overdue" || (i.Status != "Paid" && i.DueDate < today));

            return Ok(new LoanSummaryDto
            {
                ActiveLoans = activeLoans,
                TotalLoans = loans.Count,
                TotalSanctioned = totalSanctioned,
                TotalDisbursed = totalDisbursed,
                TotalOutstanding = totalOutstanding,
                TotalAmountPaid = totalAmountPaid,
                TotalPrincipalPaid = totalPrincipalPaid,
                TotalInterestPaid = totalInterestPaid,
                UpcomingPaymentsCount = upcomingCount,
                OverdueInstallmentsCount = overdueCount
            });
        }

        // GET: api/Loan/payments
        [HttpGet("payments")]
        public async Task<IActionResult> GetPayments(
            [FromQuery] string? search,
            [FromQuery] string? loanNo,
            [FromQuery] string? paymentMode)
        {
            var query = _context.LoanPayments
                .Include(p => p.Loan)
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(p => p.VoucherNo.ToLower().Contains(s) ||
                                         p.Loan!.LoanNo.ToLower().Contains(s) ||
                                         p.PaymentMode.ToLower().Contains(s) ||
                                         (p.ReferenceNo != null && p.ReferenceNo.ToLower().Contains(s)) ||
                                         (p.Remarks != null && p.Remarks.ToLower().Contains(s)));
            }

            if (!string.IsNullOrWhiteSpace(loanNo) && !loanNo.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Loan!.LoanNo == loanNo);
            }

            if (!string.IsNullOrWhiteSpace(paymentMode) && !paymentMode.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.PaymentMode == paymentMode);
            }

            var payments = await query.OrderByDescending(p => p.PaymentDate).ThenByDescending(p => p.Id).ToListAsync();

            var result = payments.Select(p => new
            {
                paymentId = p.Id,
                id = p.VoucherNo,
                voucherNo = p.VoucherNo,
                loanId = p.LoanId,
                loanNo = p.Loan?.LoanNo ?? string.Empty,
                bankName = p.Loan?.BankLender ?? string.Empty,
                paymentDate = p.PaymentDate,
                installmentNumber = p.InstallmentNumber,
                principal = p.Principal,
                interest = p.Interest,
                penalty = p.Penalty,
                totalPayment = p.TotalPayment,
                paymentMode = p.PaymentMode,
                referenceNo = p.ReferenceNo,
                remarks = p.Remarks,
                paymentType = p.PaymentType,
                createdAt = p.CreatedAt
            });

            return Ok(result);
        }

        // GET: api/Loan/payment-summary
        [HttpGet("payment-summary")]
        public async Task<ActionResult<LoanPaymentSummaryDto>> GetPaymentSummary()
        {
            var payments = await _context.LoanPayments.AsNoTracking().ToListAsync();

            return Ok(new LoanPaymentSummaryDto
            {
                TotalPaymentsCount = payments.Count,
                TotalAmountPaid = payments.Sum(p => p.TotalPayment),
                PrincipalReductions = payments.Sum(p => p.Principal),
                InterestAndCharges = payments.Sum(p => p.Interest + p.Penalty)
            });
        }

        // GET: api/Loan/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetLoanById(int id)
        {
            var loan = await _context.Loans
                .Include(l => l.Disbursements)
                .Include(l => l.Installments.OrderBy(i => i.InstallmentNumber))
                .Include(l => l.Payments.OrderByDescending(p => p.PaymentDate))
                .Include(l => l.Documents)
                .AsNoTracking()
                .FirstOrDefaultAsync(l => l.Id == id);

            if (loan == null) return NotFound(new { message = $"Loan with ID {id} was not found." });

            var principalPaid = loan.Payments.Sum(p => p.Principal);
            var interestPaid = loan.Payments.Sum(p => p.Interest);
            var totalPaid = loan.Payments.Sum(p => p.TotalPayment);

            return Ok(new
            {
                loanId = loan.Id,
                loanNo = loan.LoanNo,
                loanAccountNo = loan.LoanAccountNo,
                bankLender = loan.BankLender,
                bankName = loan.BankLender,
                loanType = loan.LoanType,
                loanPurpose = loan.LoanPurpose,
                sanctionAmount = loan.SanctionAmount,
                disbursedAmount = loan.DisbursedAmount,
                outstandingAmount = loan.OutstandingPrincipal,
                outstandingPrincipal = loan.OutstandingPrincipal,
                interestRate = loan.InterestRate,
                interestType = loan.InterestType,
                tenureMonths = loan.TenureMonths,
                repaymentFrequency = loan.RepaymentFrequency,
                emi = loan.EmiAmount,
                emiAmount = loan.EmiAmount,
                startDate = loan.StartDate,
                endDate = loan.EndDate,
                nextEmiDueDate = loan.NextEmiDueDate,
                processingFees = loan.ProcessingFees,
                status = loan.Status,
                remarks = loan.Remarks,
                closedDate = loan.ClosedDate,
                closureCertificateUrl = loan.ClosureCertificateUrl,
                closureRemarks = loan.ClosureRemarks,
                totalPaid,
                principalPaid,
                interestPaid,
                disbursements = loan.Disbursements.Select(d => new
                {
                    d.Id,
                    d.DisbursementNo,
                    d.DisbursementDate,
                    d.DisbursedAmount,
                    d.BankAccount,
                    d.ReferenceNo,
                    d.Remarks
                }),
                installments = loan.Installments.Select(i => new
                {
                    i.Id,
                    i.InstallmentNumber,
                    i.DueDate,
                    i.OpeningPrincipal,
                    i.PrincipalAmount,
                    i.InterestAmount,
                    i.EmiAmount,
                    i.PaidAmount,
                    i.RemainingAmount,
                    i.ClosingPrincipal,
                    i.Status,
                    i.PaidDate
                }),
                payments = loan.Payments.Select(p => new
                {
                    paymentId = p.Id,
                    id = p.VoucherNo,
                    voucherNo = p.VoucherNo,
                    p.PaymentDate,
                    p.InstallmentNumber,
                    p.Principal,
                    p.Interest,
                    p.Penalty,
                    p.TotalPayment,
                    p.PaymentMode,
                    p.ReferenceNo,
                    p.Remarks,
                    p.PaymentType
                }),
                documents = loan.Documents.Select(doc => new
                {
                    doc.Id,
                    doc.DocumentName,
                    doc.DocumentType,
                    doc.FileUrl,
                    doc.UploadedAt
                })
            });
        }

        // =========================================================================
        // 2. CREATE, EDIT & DELETE LOAN
        // =========================================================================

        // POST: api/Loan
        [HttpPost]
        public async Task<IActionResult> CreateLoan([FromBody] CreateLoanDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var existing = await _context.Loans.AnyAsync(l => l.LoanNo.ToLower() == dto.LoanNo.ToLower());
            if (existing)
            {
                return BadRequest(new { message = $"Loan Number '{dto.LoanNo}' already exists." });
            }

            var tenure = dto.TenureMonths > 0 ? dto.TenureMonths : 12;
            var frequency = string.IsNullOrWhiteSpace(dto.RepaymentFrequency) ? "Monthly" : dto.RepaymentFrequency;
            var disbursed = dto.DisbursedAmount ?? dto.SanctionAmount;
            if (disbursed > dto.SanctionAmount)
            {
                return BadRequest(new { message = "Disbursed amount cannot exceed the sanction amount." });
            }

            var emi = dto.Emi ?? LoanCalculationService.CalculateEmi(disbursed, dto.InterestRate, tenure, frequency);
            var endDate = dto.EndDate ?? dto.StartDate.AddMonths(tenure);
            var nextDueDate = LoanCalculationService.GetPeriodDueDate(dto.StartDate, 1, frequency);

            var loan = new Loan
            {
                LoanNo = dto.LoanNo.Trim(),
                LoanAccountNo = dto.LoanAccountNo?.Trim(),
                BankLender = dto.BankLender.Trim(),
                LoanType = dto.LoanType,
                LoanPurpose = dto.LoanPurpose,
                SanctionAmount = dto.SanctionAmount,
                DisbursedAmount = disbursed,
                OutstandingPrincipal = dto.OutstandingAmount ?? disbursed,
                InterestRate = dto.InterestRate,
                InterestType = dto.InterestType ?? "Fixed",
                TenureMonths = tenure,
                RepaymentFrequency = frequency,
                EmiAmount = emi,
                StartDate = dto.StartDate,
                EndDate = endDate,
                NextEmiDueDate = nextDueDate,
                ProcessingFees = dto.ProcessingFees,
                Status = (dto.OutstandingAmount ?? disbursed) <= 0 ? "Closed" : (dto.Status ?? "Active"),
                Remarks = dto.Remarks,
                FarmerId = dto.FarmerId,
                CreatedAt = DateTime.UtcNow
            };

            // Add Initial Disbursement if amount disbursed > 0
            if (disbursed > 0)
            {
                loan.Disbursements.Add(new LoanDisbursement
                {
                    DisbursementNo = $"DSB-{DateTime.UtcNow.Year}-001",
                    DisbursementDate = dto.StartDate,
                    DisbursedAmount = disbursed,
                    BankAccount = dto.BankLender,
                    ReferenceNo = "INITIAL-SANCTION-DISBURSAL",
                    Remarks = "Initial loan disbursement",
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Generate Amortization Repayment Schedule
            var schedule = LoanCalculationService.GenerateSchedule(loan);
            foreach (var inst in schedule)
            {
                loan.Installments.Add(inst);
            }

            _context.Loans.Add(loan);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLoanById), new { id = loan.Id }, new { loanId = loan.Id, loanNo = loan.LoanNo });
        }

        // PUT: api/Loan/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLoan(int id, [FromBody] UpdateLoanDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var loan = await _context.Loans
                .Include(l => l.Installments)
                .Include(l => l.Payments)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (loan == null) return NotFound(new { message = $"Loan with ID {id} was not found." });

            if (!string.Equals(loan.LoanNo, dto.LoanNo, StringComparison.OrdinalIgnoreCase))
            {
                var duplicate = await _context.Loans.AnyAsync(l => l.Id != id && l.LoanNo.ToLower() == dto.LoanNo.ToLower());
                if (duplicate) return BadRequest(new { message = $"Loan Number '{dto.LoanNo}' already exists on another loan." });
                loan.LoanNo = dto.LoanNo.Trim();
            }

            loan.LoanAccountNo = dto.LoanAccountNo?.Trim();
            loan.BankLender = dto.BankLender.Trim();
            loan.LoanType = dto.LoanType;
            loan.LoanPurpose = dto.LoanPurpose;
            loan.SanctionAmount = dto.SanctionAmount;
            loan.InterestRate = dto.InterestRate;
            loan.InterestType = dto.InterestType;
            loan.StartDate = dto.StartDate;
            loan.EndDate = dto.EndDate ?? loan.EndDate;
            loan.ProcessingFees = dto.ProcessingFees;
            loan.Remarks = dto.Remarks;
            loan.UpdatedAt = DateTime.UtcNow;

            if (dto.OutstandingAmount.HasValue)
            {
                loan.OutstandingPrincipal = dto.OutstandingAmount.Value;
                if (loan.OutstandingPrincipal <= 0) loan.Status = "Closed";
                else if (loan.Status == "Closed") loan.Status = "Active";
            }

            if (dto.Emi.HasValue && dto.Emi.Value > 0)
            {
                loan.EmiAmount = dto.Emi.Value;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Loan updated successfully", loanId = loan.Id });
        }

        // DELETE: api/Loan/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLoan(int id)
        {
            var loan = await _context.Loans
                .Include(l => l.Payments)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (loan == null) return NotFound(new { message = $"Loan with ID {id} was not found." });

            // Financial Safety Restriction: Never delete completed financial transactions
            if (loan.Payments.Any())
            {
                return BadRequest(new
                {
                    message = $"Cannot delete loan '{loan.LoanNo}' because {loan.Payments.Count} financial payment transactions have already been recorded. Use Loan Closure or settlement instead."
                });
            }

            _context.Loans.Remove(loan);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Loan '{loan.LoanNo}' deleted successfully." });
        }

        // =========================================================================
        // 3. DISBURSEMENT MANAGEMENT
        // =========================================================================

        // GET: api/Loan/{loanId}/disbursements
        [HttpGet("{loanId}/disbursements")]
        public async Task<IActionResult> GetDisbursements(int loanId)
        {
            var disbursements = await _context.LoanDisbursements
                .Where(d => d.LoanId == loanId)
                .OrderByDescending(d => d.DisbursementDate)
                .AsNoTracking()
                .ToListAsync();

            return Ok(disbursements);
        }

        // POST: api/Loan/{loanId}/disbursements
        [HttpPost("{loanId}/disbursements")]
        public async Task<IActionResult> RecordDisbursement(int loanId, [FromBody] RecordDisbursementDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var loan = await _context.Loans
                .Include(l => l.Disbursements)
                .Include(l => l.Installments)
                .FirstOrDefaultAsync(l => l.Id == loanId);

            if (loan == null) return NotFound(new { message = $"Loan with ID {loanId} was not found." });

            var currentDisbursed = loan.Disbursements.Sum(d => d.DisbursedAmount);
            if (currentDisbursed + dto.DisbursedAmount > loan.SanctionAmount)
            {
                return BadRequest(new
                {
                    message = $"Total disbursements (₹{currentDisbursed + dto.DisbursedAmount:N2}) would exceed the Sanctioned Amount (₹{loan.SanctionAmount:N2}). Requires authorized sanction revision."
                });
            }

            var dsbNo = !string.IsNullOrWhiteSpace(dto.DisbursementNo)
                ? dto.DisbursementNo.Trim()
                : $"DSB-{DateTime.UtcNow.Year}-{loan.Disbursements.Count + 1:D3}";

            var disbursement = new LoanDisbursement
            {
                LoanId = loanId,
                DisbursementNo = dsbNo,
                DisbursementDate = dto.DisbursementDate,
                DisbursedAmount = dto.DisbursedAmount,
                BankAccount = dto.BankAccount ?? loan.BankLender,
                ReferenceNo = dto.ReferenceNo,
                Remarks = dto.Remarks,
                CreatedAt = DateTime.UtcNow
            };

            _context.LoanDisbursements.Add(disbursement);

            // Update loan disbursed and outstanding principal
            loan.DisbursedAmount = currentDisbursed + dto.DisbursedAmount;
            loan.OutstandingPrincipal += dto.DisbursedAmount;
            loan.UpdatedAt = DateTime.UtcNow;

            // Recalculate schedule if outstanding changed
            var newSchedule = LoanCalculationService.GenerateSchedule(loan);
            _context.LoanInstallments.RemoveRange(loan.Installments.Where(i => i.Status == "Pending"));
            foreach (var inst in newSchedule)
            {
                _context.LoanInstallments.Add(inst);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Disbursement recorded successfully",
                disbursementId = disbursement.Id,
                disbursementNo = disbursement.DisbursementNo,
                totalDisbursed = loan.DisbursedAmount,
                outstandingPrincipal = loan.OutstandingPrincipal
            });
        }

        // =========================================================================
        // 4. REPAYMENT SCHEDULE & INSTALLMENTS
        // =========================================================================

        // GET: api/Loan/{loanId}/schedule
        [HttpGet("{loanId}/schedule")]
        public async Task<IActionResult> GetRepaymentSchedule(int loanId)
        {
            var installments = await _context.LoanInstallments
                .Where(i => i.LoanId == loanId)
                .OrderBy(i => i.InstallmentNumber)
                .AsNoTracking()
                .ToListAsync();

            return Ok(installments);
        }

        // POST: api/Loan/{loanId}/recalculate-schedule
        [HttpPost("{loanId}/recalculate-schedule")]
        public async Task<IActionResult> RecalculateSchedule(int loanId)
        {
            var loan = await _context.Loans
                .Include(l => l.Installments)
                .FirstOrDefaultAsync(l => l.Id == loanId);

            if (loan == null) return NotFound(new { message = $"Loan with ID {loanId} was not found." });

            var pendingInsts = loan.Installments.Where(i => i.Status == "Pending" || i.Status == "Overdue").ToList();
            _context.LoanInstallments.RemoveRange(pendingInsts);

            var newSchedule = LoanCalculationService.GenerateSchedule(loan);
            foreach (var inst in newSchedule)
            {
                _context.LoanInstallments.Add(inst);
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Repayment schedule recalculated successfully", count = newSchedule.Count });
        }

        // =========================================================================
        // 5. LOAN PAYMENT MANAGEMENT & ALLOCATION
        // =========================================================================

        // POST: api/Loan/{loanId}/payments
        [HttpPost("{loanId}/payments")]
        public async Task<IActionResult> RecordPayment(int loanId, [FromBody] RecordLoanPaymentDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var loan = await _context.Loans
                .Include(l => l.Payments)
                .Include(l => l.Installments.OrderBy(i => i.InstallmentNumber))
                .FirstOrDefaultAsync(l => l.Id == loanId);

            if (loan == null) return NotFound(new { message = $"Loan with ID {loanId} was not found." });

            if (loan.Status == "Closed")
            {
                return BadRequest(new { message = "This loan is already Closed. No further ordinary payments are accepted." });
            }

            var totalCalc = dto.Principal + dto.Interest + dto.Penalty;
            if (dto.TotalPayment.HasValue && Math.Abs(dto.TotalPayment.Value - totalCalc) > 0.05m)
            {
                return BadRequest(new { message = "Total payment must equal the sum of Principal + Interest + Penalty." });
            }

            if (dto.Principal > loan.OutstandingPrincipal)
            {
                return BadRequest(new
                {
                    message = $"Principal payment (₹{dto.Principal:N2}) cannot exceed current outstanding principal (₹{loan.OutstandingPrincipal:N2})."
                });
            }

            var voucherNo = !string.IsNullOrWhiteSpace(dto.VoucherNo)
                ? dto.VoucherNo.Trim()
                : $"VCH-LN-{DateTime.UtcNow.Year}-{loan.Payments.Count + 1:D3}";

            // Duplicate check
            var dupVoucher = await _context.LoanPayments.AnyAsync(p => p.VoucherNo.ToLower() == voucherNo.ToLower());
            if (dupVoucher)
            {
                voucherNo = $"VCH-LN-{DateTime.UtcNow.Year}-{DateTime.UtcNow.Ticks.ToString().Substring(10, 4)}";
            }

            var payment = new LoanPayment
            {
                LoanId = loanId,
                VoucherNo = voucherNo,
                PaymentDate = dto.PaymentDate,
                InstallmentNumber = dto.InstallmentNumber,
                Principal = dto.Principal,
                Interest = dto.Interest,
                Penalty = dto.Penalty,
                TotalPayment = totalCalc,
                PaymentMode = dto.PaymentMode,
                ReferenceNo = dto.ReferenceNo,
                Remarks = dto.Remarks,
                PaymentType = dto.PaymentType ?? "Regular EMI",
                CreatedAt = DateTime.UtcNow
            };

            _context.LoanPayments.Add(payment);

            // 1. Strictly reduce outstanding principal by principal portion only!
            loan.OutstandingPrincipal = Math.Max(0, loan.OutstandingPrincipal - dto.Principal);

            // 2. Allocate payment to installment(s)
            decimal remainingPaymentToAllocate = totalCalc;

            if (dto.InstallmentNumber.HasValue)
            {
                var targetInst = loan.Installments.FirstOrDefault(i => i.InstallmentNumber == dto.InstallmentNumber.Value);
                if (targetInst != null)
                {
                    targetInst.PaidAmount += remainingPaymentToAllocate;
                    targetInst.RemainingAmount = Math.Max(0, targetInst.EmiAmount - targetInst.PaidAmount);
                    targetInst.Status = targetInst.RemainingAmount <= 0 ? "Paid" : "Partially Paid";
                    targetInst.PaidDate = dto.PaymentDate;
                    remainingPaymentToAllocate = 0;
                }
            }

            // If not allocated or extra remaining, allocate across pending/overdue installments chronologically
            if (remainingPaymentToAllocate > 0)
            {
                var pendingList = loan.Installments
                    .Where(i => i.Status != "Paid")
                    .OrderBy(i => i.InstallmentNumber)
                    .ToList();

                foreach (var inst in pendingList)
                {
                    if (remainingPaymentToAllocate <= 0) break;
                    decimal needed = inst.RemainingAmount > 0 ? inst.RemainingAmount : inst.EmiAmount;
                    decimal alloc = Math.Min(needed, remainingPaymentToAllocate);

                    inst.PaidAmount += alloc;
                    inst.RemainingAmount = Math.Max(0, inst.EmiAmount - inst.PaidAmount);
                    inst.Status = inst.RemainingAmount <= 0 ? "Paid" : "Partially Paid";
                    inst.PaidDate = dto.PaymentDate;

                    remainingPaymentToAllocate -= alloc;
                }
            }

            // 3. Update loan status
            if (loan.OutstandingPrincipal <= 0)
            {
                loan.Status = "Closed";
                loan.ClosedDate = dto.PaymentDate;
                loan.NextEmiDueDate = null;
            }
            else
            {
                var nextPending = loan.Installments
                    .Where(i => i.Status != "Paid")
                    .OrderBy(i => i.DueDate)
                    .FirstOrDefault();

                loan.NextEmiDueDate = nextPending?.DueDate;

                var isOverdue = loan.Installments.Any(i => i.Status == "Overdue" || (i.Status != "Paid" && i.DueDate < DateTime.UtcNow.Date));
                loan.Status = isOverdue ? "Overdue" : "Active";
            }

            loan.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Payment recorded successfully",
                voucherNo = payment.VoucherNo,
                outstandingPrincipal = loan.OutstandingPrincipal,
                loanStatus = loan.Status
            });
        }

        // =========================================================================
        // 6. LOAN CLOSURE & SETTLEMENT
        // =========================================================================

        // POST: api/Loan/{loanId}/close
        [HttpPost("{loanId}/close")]
        public async Task<IActionResult> CloseLoan(int loanId, [FromBody] LoanClosureDto dto)
        {
            var loan = await _context.Loans
                .Include(l => l.Payments)
                .Include(l => l.Installments)
                .FirstOrDefaultAsync(l => l.Id == loanId);

            if (loan == null) return NotFound(new { message = $"Loan with ID {loanId} was not found." });

            if (loan.Status == "Closed")
            {
                return BadRequest(new { message = "This loan is already Closed." });
            }

            // If settlement amount is provided and outstanding principal > 0, record final settlement payment
            if (dto.FinalSettlementAmount > 0 && loan.OutstandingPrincipal > 0)
            {
                var finalPrincipal = Math.Min(loan.OutstandingPrincipal, dto.FinalSettlementAmount);
                var finalInterest = dto.FinalSettlementAmount - finalPrincipal;

                var settlementPayment = new LoanPayment
                {
                    LoanId = loanId,
                    VoucherNo = $"VCH-LN-CLS-{DateTime.UtcNow.Year}-{loan.Payments.Count + 1:D3}",
                    PaymentDate = dto.ClosedDate,
                    Principal = finalPrincipal,
                    Interest = finalInterest,
                    Penalty = 0,
                    TotalPayment = dto.FinalSettlementAmount,
                    PaymentMode = dto.PaymentMode,
                    ReferenceNo = dto.ReferenceNo ?? "FULL-LOAN-FORECLOSURE",
                    Remarks = "Full loan settlement and closure payment",
                    PaymentType = "Prepayment / Foreclosure",
                    CreatedAt = DateTime.UtcNow
                };

                _context.LoanPayments.Add(settlementPayment);
                loan.OutstandingPrincipal = 0;
            }

            // Mark all remaining installments as Paid or Closed
            foreach (var inst in loan.Installments.Where(i => i.Status != "Paid"))
            {
                inst.Status = "Paid";
                inst.PaidDate = dto.ClosedDate;
                inst.RemainingAmount = 0;
            }

            loan.Status = "Closed";
            loan.ClosedDate = dto.ClosedDate;
            loan.ClosureCertificateUrl = dto.ClosureCertificateUrl;
            loan.ClosureRemarks = dto.Remarks ?? "Loan successfully settled and closed.";
            loan.NextEmiDueDate = null;
            loan.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Loan '{loan.LoanNo}' has been closed successfully.",
                closedDate = loan.ClosedDate,
                status = loan.Status
            });
        }

        // =========================================================================
        // 7. LOAN REPORTS
        // =========================================================================

        // GET: api/Loan/reports/{reportType}
        [HttpGet("reports/{reportType}")]
        public async Task<IActionResult> GetReport(
            string reportType,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            [FromQuery] string? bank,
            [FromQuery] string? loanType,
            [FromQuery] string? status)
        {
            var loansQuery = _context.Loans
                .Include(l => l.Disbursements)
                .Include(l => l.Installments)
                .Include(l => l.Payments)
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(bank) && !bank.Equals("All", StringComparison.OrdinalIgnoreCase))
                loansQuery = loansQuery.Where(l => l.BankLender == bank);

            if (!string.IsNullOrWhiteSpace(loanType) && !loanType.Equals("All", StringComparison.OrdinalIgnoreCase))
                loansQuery = loansQuery.Where(l => l.LoanType == loanType);

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
                loansQuery = loansQuery.Where(l => l.Status == status);

            var loans = await loansQuery.ToListAsync();

            var today = DateTime.UtcNow.Date;

            switch (reportType.ToLower())
            {
                case "summary":
                    var summaryData = loans.Select(l => new
                    {
                        l.LoanNo,
                        l.BankLender,
                        l.LoanType,
                        l.SanctionAmount,
                        l.DisbursedAmount,
                        l.OutstandingPrincipal,
                        l.InterestRate,
                        l.TenureMonths,
                        l.EmiAmount,
                        l.StartDate,
                        l.EndDate,
                        l.Status,
                        TotalPaid = l.Payments.Sum(p => p.TotalPayment),
                        PrincipalRepaid = l.Payments.Sum(p => p.Principal),
                        InterestPaid = l.Payments.Sum(p => p.Interest + p.Penalty)
                    });
                    return Ok(summaryData);

                case "outstanding":
                    var outstandingData = loans.Where(l => l.OutstandingPrincipal > 0).Select(l => new
                    {
                        l.LoanNo,
                        l.BankLender,
                        l.LoanType,
                        l.SanctionAmount,
                        l.OutstandingPrincipal,
                        l.NextEmiDueDate,
                        l.EmiAmount,
                        OverdueInstallments = l.Installments.Count(i => i.Status == "Overdue"),
                        l.Status
                    });
                    return Ok(outstandingData);

                case "schedule":
                    var scheduleData = loans.SelectMany(l => l.Installments.Select(i => new
                    {
                        l.LoanNo,
                        l.BankLender,
                        i.InstallmentNumber,
                        i.DueDate,
                        i.OpeningPrincipal,
                        i.PrincipalAmount,
                        i.InterestAmount,
                        i.EmiAmount,
                        i.PaidAmount,
                        i.RemainingAmount,
                        i.ClosingPrincipal,
                        i.Status
                    })).OrderBy(i => i.LoanNo).ThenBy(i => i.InstallmentNumber);
                    return Ok(scheduleData);

                case "upcoming":
                    var upcomingData = loans.SelectMany(l => l.Installments
                        .Where(i => i.Status != "Paid" && i.DueDate >= today && i.DueDate <= today.AddDays(45))
                        .Select(i => new
                        {
                            l.LoanNo,
                            l.BankLender,
                            l.LoanType,
                            i.InstallmentNumber,
                            i.DueDate,
                            i.EmiAmount,
                            i.RemainingAmount,
                            DaysRemaining = (i.DueDate - today).Days
                        })).OrderBy(i => i.DueDate);
                    return Ok(upcomingData);

                case "overdue":
                    var overdueData = loans.SelectMany(l => l.Installments
                        .Where(i => i.Status == "Overdue" || (i.Status != "Paid" && i.DueDate < today))
                        .Select(i => new
                        {
                            l.LoanNo,
                            l.BankLender,
                            i.InstallmentNumber,
                            i.DueDate,
                            i.EmiAmount,
                            i.PaidAmount,
                            i.RemainingAmount,
                            DaysOverdue = (today - i.DueDate).Days
                        })).OrderBy(i => i.DueDate);
                    return Ok(overdueData);

                case "principal-repayment":
                case "interest-paid":
                case "payment-history":
                    var paymentsQuery = _context.LoanPayments
                        .Include(p => p.Loan)
                        .AsNoTracking()
                        .AsQueryable();

                    if (fromDate.HasValue) paymentsQuery = paymentsQuery.Where(p => p.PaymentDate >= fromDate.Value);
                    if (toDate.HasValue) paymentsQuery = paymentsQuery.Where(p => p.PaymentDate <= toDate.Value);
                    if (!string.IsNullOrWhiteSpace(bank) && !bank.Equals("All", StringComparison.OrdinalIgnoreCase))
                        paymentsQuery = paymentsQuery.Where(p => p.Loan!.BankLender == bank);

                    var payments = await paymentsQuery.OrderByDescending(p => p.PaymentDate).ToListAsync();
                    var pData = payments.Select(p => new
                    {
                        p.VoucherNo,
                        LoanNo = p.Loan?.LoanNo,
                        BankLender = p.Loan?.BankLender,
                        p.PaymentDate,
                        p.InstallmentNumber,
                        p.Principal,
                        p.Interest,
                        p.Penalty,
                        p.TotalPayment,
                        p.PaymentMode,
                        p.ReferenceNo,
                        p.PaymentType
                    });
                    return Ok(pData);

                case "disbursement-history":
                    var dsbQuery = _context.LoanDisbursements
                        .Include(d => d.Loan)
                        .AsNoTracking()
                        .AsQueryable();

                    if (fromDate.HasValue) dsbQuery = dsbQuery.Where(d => d.DisbursementDate >= fromDate.Value);
                    if (toDate.HasValue) dsbQuery = dsbQuery.Where(d => d.DisbursementDate <= toDate.Value);

                    var disbursements = await dsbQuery.OrderByDescending(d => d.DisbursementDate).ToListAsync();
                    var dData = disbursements.Select(d => new
                    {
                        d.DisbursementNo,
                        LoanNo = d.Loan?.LoanNo,
                        d.DisbursementDate,
                        d.DisbursedAmount,
                        d.BankAccount,
                        d.ReferenceNo,
                        d.Remarks
                    });
                    return Ok(dData);

                case "closure-statement":
                    var closedLoans = loans.Where(l => l.Status == "Closed").Select(l => new
                    {
                        l.LoanNo,
                        l.BankLender,
                        l.LoanType,
                        l.SanctionAmount,
                        l.DisbursedAmount,
                        l.StartDate,
                        l.ClosedDate,
                        TotalPrincipalRepaid = l.Payments.Sum(p => p.Principal),
                        TotalInterestPaid = l.Payments.Sum(p => p.Interest + p.Penalty),
                        TotalSettlementPaid = l.Payments.Sum(p => p.TotalPayment),
                        l.ClosureRemarks,
                        l.ClosureCertificateUrl
                    });
                    return Ok(closedLoans);

                default:
                    return BadRequest(new { message = $"Unknown report type '{reportType}'." });
            }
        }

        // =========================================================================
        // 8. LOAN DOCUMENTS
        // =========================================================================

        // POST: api/Loan/{loanId}/documents
        [HttpPost("{loanId}/documents")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadDocument(int loanId, [FromForm] LoanDocumentUploadDto dto)
        {
            var loan = await _context.Loans.FindAsync(loanId);
            if (loan == null) return NotFound(new { message = $"Loan with ID {loanId} was not found." });

            var file = dto.File;
            var documentType = string.IsNullOrWhiteSpace(dto.DocumentType) ? "Other" : dto.DocumentType.Trim();

            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file was uploaded." });
            }

            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "loans");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{loan.LoanNo}_{DateTime.UtcNow.Ticks}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var fileUrl = $"/uploads/loans/{fileName}";

            var doc = new LoanDocument
            {
                LoanId = loanId,
                DocumentName = file.FileName,
                DocumentType = string.IsNullOrWhiteSpace(documentType) ? "Sanction Letter" : documentType,
                FileUrl = fileUrl,
                UploadedAt = DateTime.UtcNow
            };

            _context.LoanDocuments.Add(doc);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Document uploaded successfully",
                documentId = doc.Id,
                doc.DocumentName,
                doc.DocumentType,
                doc.FileUrl
            });
        }
    }
}
