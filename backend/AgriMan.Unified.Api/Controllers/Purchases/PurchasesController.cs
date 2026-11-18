using FarmManagementApi.Data;
using FarmManagementApi.DTOs;
using FarmManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmManagementApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PurchasesController : ControllerBase
    {
        private readonly FarmDbContext _context;

        public PurchasesController(FarmDbContext context)
        {
            _context = context;
        }

        // GET: api/purchases?farmerId=1
        [HttpGet]
        public async Task<IActionResult> GetPurchases([FromQuery] int? farmerId)
        {
            var query = _context.Purchases
                .Include(p => p.Supplier)
                .Include(p => p.Items)
                .Include(p => p.Payments)
                .AsQueryable();

            if (farmerId.HasValue)
                query = query.Where(p => p.FarmerId == farmerId.Value);

            var purchases = await query.OrderByDescending(p => p.PurchaseDate).ToListAsync();
            return Ok(purchases);
        }

        // GET: api/purchases/5
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetPurchase(long id)
        {
            var purchase = await _context.Purchases
                .Include(p => p.Supplier)
                .Include(p => p.Items)
                .Include(p => p.Payments)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (purchase == null)
                return NotFound(new { message = $"Purchase with ID {id} not found." });

            return Ok(purchase);
        }

        // POST: api/purchases
        [HttpPost]
        public async Task<IActionResult> CreatePurchase([FromBody] CreatePurchaseDto dto)
        {
            var farmerExists = await _context.Farmers.AnyAsync(f => f.Id == dto.FarmerId);
            if (!farmerExists)
                return BadRequest(new { message = $"Farmer with ID {dto.FarmerId} does not exist." });

            var supplierExists = await _context.Suppliers.AnyAsync(s => s.Id == dto.SupplierId);
            if (!supplierExists)
                return BadRequest(new { message = $"Supplier with ID {dto.SupplierId} does not exist." });

            // Generate unique Purchase Number (e.g., PUR-20261029-XXXX)
            var count = await _context.Purchases.CountAsync();
            var purchaseNo = $"PUR-{DateTime.UtcNow:yyyyMMdd}-{count + 1:D4}";

            var purchase = new Purchase
            {
                PurchaseNo = purchaseNo,
                PurchaseDate = dto.PurchaseDate ?? DateTime.UtcNow,
                FarmerId = dto.FarmerId,
                SupplierId = dto.SupplierId,
                FarmId = dto.FarmId,
                CropId = dto.CropId,
                Notes = dto.Notes
            };

            decimal subTotal = 0;
            decimal totalDiscount = 0;
            decimal totalTax = 0;

            foreach (var itemDto in dto.Items)
            {
                var lineSubtotal = itemDto.Quantity * itemDto.Rate;
                var lineTotal = (lineSubtotal - itemDto.Discount) + itemDto.TaxRate;

                subTotal += lineSubtotal;
                totalDiscount += itemDto.Discount;
                totalTax += itemDto.TaxRate;

                purchase.Items.Add(new PurchaseItem
                {
                    ProductName = itemDto.ProductName,
                    Unit = itemDto.Unit,
                    Quantity = itemDto.Quantity,
                    Rate = itemDto.Rate,
                    Discount = itemDto.Discount,
                    TaxRate = itemDto.TaxRate,
                    Total = lineTotal
                });
            }

            purchase.SubTotal = subTotal;
            purchase.DiscountAmount = totalDiscount;
            purchase.TaxAmount = totalTax;
            purchase.TotalAmount = subTotal - totalDiscount + totalTax;

            // Handle optional initial payment
            decimal initialPayment = dto.PaidAmount ?? 0;
            if (initialPayment > 0)
            {
                purchase.Payments.Add(new PurchasePayment
                {
                    Amount = initialPayment,
                    PaymentMode = dto.PaymentMode ?? "Cash",
                    BankOrCash = dto.BankOrCash ?? "Cash",
                    ReferenceNumber = dto.ReferenceNumber,
                    PaymentDate = DateTime.UtcNow
                });
            }

            purchase.PaidAmount = initialPayment;
            purchase.BalanceAmount = purchase.TotalAmount - initialPayment;
            purchase.PaymentStatus = purchase.BalanceAmount <= 0 ? "Paid" : (purchase.PaidAmount > 0 ? "Partial" : "Pending");

            _context.Purchases.Add(purchase);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPurchase), new { id = purchase.Id }, purchase);
        }

        // POST: api/purchases/5/payments
        [HttpPost("{id:long}/payments")]
        public async Task<IActionResult> AddPayment(long id, [FromBody] AddPurchasePaymentDto dto)
        {
            var purchase = await _context.Purchases
                .Include(p => p.Payments)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (purchase == null)
                return NotFound(new { message = $"Purchase with ID {id} not found." });

            if (purchase.BalanceAmount <= 0)
                return BadRequest(new { message = "This purchase is already fully paid." });

            if (dto.Amount > purchase.BalanceAmount)
                return BadRequest(new { message = $"Payment amount exceeds balance of {purchase.BalanceAmount}." });

            var payment = new PurchasePayment
            {
                PurchaseId = id,
                Amount = dto.Amount,
                PaymentMode = dto.PaymentMode,
                BankOrCash = dto.BankOrCash,
                ReferenceNumber = dto.ReferenceNumber,
                Notes = dto.Notes,
                PaymentDate = DateTime.UtcNow
            };

            purchase.Payments.Add(payment);
            purchase.PaidAmount += dto.Amount;
            purchase.BalanceAmount = purchase.TotalAmount - purchase.PaidAmount;
            purchase.PaymentStatus = purchase.BalanceAmount <= 0 ? "Paid" : "Partial";

            await _context.SaveChangesAsync();
            return Ok(purchase);
        }

        // DELETE: api/purchases/5
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> DeletePurchase(long id)
        {
            var purchase = await _context.Purchases.FindAsync(id);
            if (purchase == null)
                return NotFound(new { message = $"Purchase with ID {id} not found." });

            _context.Purchases.Remove(purchase);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}