using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmManagementApi.Data;
using FarmManagementApi.DTOs;
using FarmManagementApi.Models;

namespace FarmManagementApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IncomeController : ControllerBase
    {
        private readonly FarmDbContext _context;

        public IncomeController(FarmDbContext context)
        {
            _context = context;
        }

        // GET: api/income/categories
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var list = await _context.IncomeCategories
                .Select(c => new
                {
                    c.Id,
                    Code = string.IsNullOrEmpty(c.Code) ? $"INC-CAT-{c.Id:D3}" : c.Code,
                    c.Name,
                    Source = c.Source ?? "Farm operations",
                    c.Description,
                    Status = string.IsNullOrEmpty(c.Status) ? (c.IsActive ? "Active" : "Inactive") : c.Status,
                    c.IsActive
                })
                .ToListAsync();

            return Ok(list);
        }

        // GET: api/income/categories/{id}
        [HttpGet("categories/{id}")]
        public async Task<IActionResult> GetCategory(int id)
        {
            var c = await _context.IncomeCategories.FindAsync(id);
            if (c == null) return NotFound();

            return Ok(new
            {
                c.Id,
                Code = string.IsNullOrEmpty(c.Code) ? $"INC-CAT-{c.Id:D3}" : c.Code,
                c.Name,
                Source = c.Source ?? "Farm operations",
                c.Description,
                Status = string.IsNullOrEmpty(c.Status) ? (c.IsActive ? "Active" : "Inactive") : c.Status,
                c.IsActive
            });
        }

        // POST: api/income/categories
        [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory([FromBody] IncomeCategory category)
        {
            if (string.IsNullOrWhiteSpace(category.Code))
            {
                var count = await _context.IncomeCategories.CountAsync() + 1;
                category.Code = $"INC-CAT-{count:D3}";
            }
            if (string.IsNullOrWhiteSpace(category.Status))
            {
                category.Status = category.IsActive ? "Active" : "Inactive";
            }
            category.CreatedAt = DateTime.UtcNow;
            _context.IncomeCategories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
        }

        // PUT: api/income/categories/{id}
        [HttpPut("categories/{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] IncomeCategory updated)
        {
            var category = await _context.IncomeCategories.FindAsync(id);
            if (category == null) return NotFound();

            category.Name = updated.Name;
            category.Code = string.IsNullOrWhiteSpace(updated.Code) ? category.Code : updated.Code;
            category.Source = updated.Source;
            category.Description = updated.Description;
            category.Status = updated.Status ?? "Active";
            category.IsActive = category.Status == "Active";

            await _context.SaveChangesAsync();
            return Ok(category);
        }

        // DELETE: api/income/categories/{id}
        [HttpDelete("categories/{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.IncomeCategories.FindAsync(id);
            if (category == null) return NotFound();

            _context.IncomeCategories.Remove(category);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // GET: api/income (Screen – Income List)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<IncomeListDto>>> GetIncomes(
            [FromQuery] string? search,
            [FromQuery] int? categoryId,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            var query = _context.IncomeTransactions
                .Include(t => t.Category)
                .Include(t => t.Farmer)
                .Include(t => t.Payments)
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(t => t.IncomeNo.Contains(search) ||
                                         (t.Farmer != null && t.Farmer.FarmerName.Contains(search)) ||
                                         t.Buyer.Contains(search) ||
                                         t.Farm.Contains(search));
            }

            if (categoryId.HasValue)
            {
                query = query.Where(t => t.CategoryId == categoryId.Value);
            }

            if (fromDate.HasValue)
            {
                query = query.Where(t => t.IncomeDate >= fromDate.Value);
            }

            if (toDate.HasValue)
            {
                query = query.Where(t => t.IncomeDate <= toDate.Value);
            }

            var list = await query
                .OrderByDescending(t => t.IncomeDate)
                .Select(t => new IncomeListDto
                {
                    Id = t.Id,
                    Date = t.IncomeDate,
                    IncomeNo = t.IncomeNo,
                    Farmer = t.Farmer != null ? t.Farmer.FarmerName : "N/A",
                    Farm = t.Farm,
                    Crop = t.Crop,
                    IncomeType = t.Category != null ? t.Category.Name : "N/A",
                    Buyer = t.Buyer,
                    Amount = t.NetAmount,
                    PaymentMode = t.Payments.Select(p => p.PaymentMode).FirstOrDefault() ?? "Unpaid",
                    Status = t.Status
                })
                .ToListAsync();

            return Ok(list);
        }

        // GET: api/income/{id}
        [HttpGet("{id:long}")]
        public async Task<ActionResult<IncomeDetailDto>> GetIncomeById(long id)
        {
            var tx = await _context.IncomeTransactions
                .Include(t => t.Category)
                .Include(t => t.Farmer)
                .Include(t => t.Items)
                .Include(t => t.Payments)
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tx == null)
            {
                return NotFound(new { message = $"Income transaction with ID {id} was not found." });
            }

            var item = tx.Items.FirstOrDefault();
            var payment = tx.Payments.FirstOrDefault();

            var detail = new IncomeDetailDto
            {
                Id = tx.Id,
                IncomeNo = tx.IncomeNo,
                IncomeDate = tx.IncomeDate,
                CategoryId = tx.CategoryId,
                IncomeType = tx.Category?.Name ?? string.Empty,
                FarmerId = tx.FarmerId,
                Farmer = tx.Farmer != null ? tx.Farmer.FarmerName : string.Empty,
                Farm = tx.Farm,
                Crop = tx.Crop,
                Buyer = tx.Buyer,
                Quantity = item?.Quantity ?? 0,
                Unit = item?.Unit ?? string.Empty,
                Rate = item?.Rate ?? 0,
                GrossAmount = tx.GrossAmount,
                Discount = tx.Discount,
                OtherCharges = tx.OtherCharges,
                NetAmount = tx.NetAmount,
                PaymentMode = payment?.PaymentMode ?? string.Empty,
                BankOrCash = payment?.BankOrCash,
                ReferenceNumber = payment?.ReferenceNumber,
                Status = tx.Status,
                Remarks = tx.Remarks
            };

            return Ok(detail);
        }

        // POST: api/income (Add Income)
        [HttpPost]
        public async Task<IActionResult> CreateIncome([FromBody] CreateIncomeTransactionDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            decimal gross = dto.Quantity * dto.Rate;
            decimal net = gross - dto.Discount + dto.OtherCharges;

            // Generate clean unique income reference: INC-YYYYMMDD-XXXX
            string datePrefix = DateTime.UtcNow.ToString("yyyyMMdd");
            int todayCount = await _context.IncomeTransactions
                .CountAsync(t => t.IncomeNo.StartsWith($"INC-{datePrefix}"));
            string incomeNo = $"INC-{datePrefix}-{(todayCount + 1):D4}";

            var tx = new IncomeTransaction
            {
                IncomeNo = incomeNo,
                IncomeDate = dto.IncomeDate,
                CategoryId = dto.CategoryId,
                FarmerId = dto.FarmerId,
                Farm = dto.Farm,
                Crop = dto.Crop,
                Buyer = dto.Buyer,
                GrossAmount = gross,
                Discount = dto.Discount,
                OtherCharges = dto.OtherCharges,
                NetAmount = net,
                Status = dto.Status,
                Remarks = dto.Remarks,
                CreatedAt = DateTime.UtcNow,
                Items = new List<IncomeTransactionItem>
                {
                    new()
                    {
                        ItemName = dto.Crop ?? "Income Item",
                        Quantity = dto.Quantity,
                        Unit = dto.Unit,
                        Rate = dto.Rate,
                        TotalAmount = gross
                    }
                },
                Payments = new List<IncomePayment>
                {
                    new()
                    {
                        Amount = net,
                        PaymentMode = dto.PaymentMode,
                        BankOrCash = dto.BankOrCash,
                        ReferenceNumber = dto.ReferenceNumber,
                        PaymentDate = dto.IncomeDate
                    }
                }
            };

            _context.IncomeTransactions.Add(tx);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetIncomeById), new { id = tx.Id }, new { id = tx.Id, incomeNo = tx.IncomeNo });
        }

        // PUT: api/income/{id}
        [HttpPut("{id:long}")]
        public async Task<IActionResult> UpdateIncome(long id, [FromBody] CreateIncomeTransactionDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var tx = await _context.IncomeTransactions
                .Include(t => t.Items)
                .Include(t => t.Payments)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tx == null)
            {
                return NotFound(new { message = $"Income transaction with ID {id} was not found." });
            }

            decimal gross = dto.Quantity * dto.Rate;
            decimal net = gross - dto.Discount + dto.OtherCharges;

            tx.IncomeDate = dto.IncomeDate;
            tx.CategoryId = dto.CategoryId;
            tx.FarmerId = dto.FarmerId;
            tx.Farm = dto.Farm;
            tx.Crop = dto.Crop;
            tx.Buyer = dto.Buyer;
            tx.GrossAmount = gross;
            tx.Discount = dto.Discount;
            tx.OtherCharges = dto.OtherCharges;
            tx.NetAmount = net;
            tx.Status = dto.Status;
            tx.Remarks = dto.Remarks;

            // Update associated item
            var item = tx.Items.FirstOrDefault();
            if (item != null)
            {
                item.ItemName = dto.Crop ?? "Income Item";
                item.Quantity = dto.Quantity;
                item.Unit = dto.Unit;
                item.Rate = dto.Rate;
                item.TotalAmount = gross;
            }

            // Update associated payment
            var payment = tx.Payments.FirstOrDefault();
            if (payment != null)
            {
                payment.Amount = net;
                payment.PaymentMode = dto.PaymentMode;
                payment.BankOrCash = dto.BankOrCash;
                payment.ReferenceNumber = dto.ReferenceNumber;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/income/{id}
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> DeleteIncome(long id)
        {
            var tx = await _context.IncomeTransactions.FindAsync(id);
            if (tx == null)
            {
                return NotFound(new { message = $"Income transaction with ID {id} was not found." });
            }

            _context.IncomeTransactions.Remove(tx);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}