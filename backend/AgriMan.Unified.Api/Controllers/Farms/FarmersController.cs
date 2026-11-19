using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmManagementApi.Data;
using FarmManagementApi.DTOs;
using FarmManagementApi.Models;

namespace FarmManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FarmersController : ControllerBase
{
    private readonly FarmDbContext _context;

    public FarmersController(FarmDbContext context)
    {
        _context = context;
    }

    // GET: /api/Farmers
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FarmerDto>>> GetFarmers([FromQuery] string? search = null, [FromQuery] string? status = null)
    {
        var query = _context.Farmers
            .Include(f => f.Address)
            .Include(f => f.BankAccount)
            .Include(f => f.Farms)
                .ThenInclude(farm => farm.LandDetails)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(f => f.Status.ToLower() == status.Trim().ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(f =>
                f.FarmerName.ToLower().Contains(term) ||
                f.FarmerCode.ToLower().Contains(term) ||
                f.Mobile.Contains(term) ||
                (f.Email != null && f.Email.ToLower().Contains(term)) ||
                (f.Village != null && f.Village.ToLower().Contains(term)) ||
                (f.District != null && f.District.ToLower().Contains(term)) ||
                (f.Address != null && (
                    f.Address.Village.ToLower().Contains(term) ||
                    f.Address.District.ToLower().Contains(term) ||
                    f.Address.State.ToLower().Contains(term)
                ))
            );
        }

        var farmers = await query.OrderBy(f => f.FarmerName).ToListAsync();

        var result = farmers.Select(f => MapToFarmerDto(f)).ToList();

        return Ok(result);
    }

    // GET: /api/Farmers/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<FarmerDto>> GetFarmerById(int id)
    {
        var farmer = await _context.Farmers
            .Include(f => f.Address)
            .Include(f => f.BankAccount)
            .Include(f => f.Farms)
                .ThenInclude(farm => farm.LandDetails)
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id == id);

        if (farmer == null)
        {
            return NotFound(new { message = $"Farmer with ID {id} not found." });
        }

        return Ok(MapToFarmerDto(farmer));
    }

    // GET: /api/Farmers/code/{code}
    [HttpGet("code/{code}")]
    public async Task<ActionResult<FarmerDto>> GetFarmerByCode(string code)
    {
        var farmer = await _context.Farmers
            .Include(f => f.Address)
            .Include(f => f.BankAccount)
            .Include(f => f.Farms)
                .ThenInclude(farm => farm.LandDetails)
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.FarmerCode.ToLower() == code.Trim().ToLower());

        if (farmer == null)
        {
            return NotFound(new { message = $"Farmer with Code '{code}' not found." });
        }

        return Ok(MapToFarmerDto(farmer));
    }

    // GET: /api/Farmers/{id}/lands
    [HttpGet("{id:int}/lands")]
    public async Task<ActionResult<FarmerWithLandsDto>> GetFarmerLands(int id)
    {
        var farmer = await _context.Farmers
            .Include(f => f.Address)
            .Include(f => f.Farms)
                .ThenInclude(farm => farm.LandDetails)
                    .ThenInclude(ld => ld.IrrigationSource)
            .Include(f => f.Farms)
                .ThenInclude(farm => farm.LandDetails)
                    .ThenInclude(ld => ld.SoilType)
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id == id);

        if (farmer == null)
        {
            return NotFound(new { message = $"Farmer with ID {id} not found." });
        }

        var result = new FarmerWithLandsDto
        {
            FarmerId = farmer.Id,
            FarmerName = farmer.FarmerName,
            PhoneNumber = farmer.Mobile,
            Village = farmer.Village ?? farmer.Address?.Village,
            Mandal = farmer.Mandal ?? farmer.Address?.Mandal,
            District = farmer.District ?? farmer.Address?.District,
            Farms = farmer.Farms.Select(farm => new FarmerFarmSummaryDto
            {
                FarmId = farm.Id,
                FarmName = farm.FarmName,
                OwnershipType = farm.OwnershipType,
                Village = farm.Village,
                Mandal = farm.Mandal,
                District = farm.District,
                Status = farm.Status,
                Lands = farm.LandDetails.Select(ld => new LandDetailDto
                {
                    Id = ld.Id,
                    FarmId = ld.FarmId,
                    FarmName = farm.FarmName,
                    SurveyNumber = ld.SurveyNumber,
                    LandArea = ld.LandArea,
                    AreaUnit = ld.AreaUnit,
                    LandType = ld.LandType,
                    IrrigationSourceId = ld.IrrigationSourceId,
                    IrrigationSourceName = ld.IrrigationSource?.Name ?? "N/A",
                    SoilTypeId = ld.SoilTypeId,
                    SoilTypeName = ld.SoilType?.Name ?? "N/A",
                    BoundariesNorth = ld.BoundariesNorth,
                    BoundariesSouth = ld.BoundariesSouth,
                    BoundariesEast = ld.BoundariesEast,
                    BoundariesWest = ld.BoundariesWest,
                    Remarks = ld.Remarks,
                    CreatedAt = ld.CreatedAt
                }).ToList()
            }).ToList()
        };

        return Ok(result);
    }

    // GET: /api/Farmers/{id}/rental-lands
    [HttpGet("{id:int}/rental-lands")]
    [HttpGet("{id:int}/rental")]
    [HttpGet("{id:int}/rental-land")]
    [HttpGet("{id:int}/rentallands")]
    public async Task<ActionResult<IEnumerable<object>>> GetFarmerRentalLands(int id)
    {
        var farmer = await _context.Farmers.FindAsync(id);
        if (farmer == null)
        {
            return NotFound(new { message = $"Farmer with ID {id} not found." });
        }

        // Return empty list (or any associated rental parcels) with 200 OK
        return Ok(new List<object>());
    }

    // POST: /api/Farmers
    [HttpPost]
    public async Task<ActionResult<FarmerDto>> CreateFarmer([FromBody] CreateFarmerDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Auto-generate FarmerCode if not supplied
            string farmerCode = dto.FarmerCode?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(farmerCode))
            {
                int year = DateTime.UtcNow.Year;
                int count = await _context.Farmers.CountAsync() + 1;
                farmerCode = $"FARM-{year}-{count:D3}";
                while (await _context.Farmers.AnyAsync(f => f.FarmerCode == farmerCode))
                {
                    count++;
                    farmerCode = $"FARM-{year}-{count:D3}";
                }
            }
            else if (await _context.Farmers.AnyAsync(f => f.FarmerCode == farmerCode))
            {
                return BadRequest(new { message = $"Farmer code '{farmerCode}' already exists." });
            }

            var farmer = new Farmer
            {
                FarmerCode = farmerCode,
                FarmerName = dto.FarmerName.Trim(),
                FatherOrHusbandName = dto.FatherOrHusbandName?.Trim(),
                Mobile = dto.Mobile.Trim(),
                AlternateMobile = dto.AlternateMobile?.Trim(),
                Email = dto.Email?.Trim(),
                AadhaarNo = dto.AadhaarNo?.Trim(),
                TotalLand = dto.TotalLand,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim(),
                Village = dto.Village?.Trim() ?? dto.Address?.Village?.Trim() ?? string.Empty,
                Mandal = dto.Mandal?.Trim() ?? dto.Address?.Mandal?.Trim() ?? string.Empty,
                District = dto.District?.Trim() ?? dto.Address?.District?.Trim() ?? string.Empty,
                CreatedAt = DateTime.UtcNow
            };

            if (dto.Address != null && (!string.IsNullOrWhiteSpace(dto.Address.Village) || !string.IsNullOrWhiteSpace(dto.Address.District)))
            {
                farmer.Address = new FarmerAddress
                {
                    Address = dto.Address.Address?.Trim(),
                    Village = dto.Address.Village?.Trim() ?? string.Empty,
                    Mandal = dto.Address.Mandal?.Trim() ?? string.Empty,
                    District = dto.Address.District?.Trim() ?? string.Empty,
                    State = dto.Address.State?.Trim() ?? string.Empty,
                    PinCode = dto.Address.PinCode?.Trim() ?? string.Empty
                };
            }

            if (dto.BankAccount != null && (!string.IsNullOrWhiteSpace(dto.BankAccount.BankName) || !string.IsNullOrWhiteSpace(dto.BankAccount.AccountNumber)))
            {
                farmer.BankAccount = new FarmerBankAccount
                {
                    BankName = dto.BankAccount.BankName?.Trim() ?? string.Empty,
                    AccountNumber = dto.BankAccount.AccountNumber?.Trim() ?? string.Empty,
                    IFSC = dto.BankAccount.IFSC?.Trim() ?? string.Empty
                };
            }

            _context.Farmers.Add(farmer);
            await _context.SaveChangesAsync();

            return Ok(MapToFarmerDto(farmer));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to create farmer: " + ex.Message, details = ex.InnerException?.Message });
        }
    }

    // PUT: /api/Farmers/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateFarmer(int id, [FromBody] CreateFarmerDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var farmer = await _context.Farmers
            .Include(f => f.Address)
            .Include(f => f.BankAccount)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (farmer == null)
        {
            return NotFound(new { message = $"Farmer with ID {id} not found." });
        }

        if (!string.IsNullOrWhiteSpace(dto.FarmerCode) &&
            await _context.Farmers.AnyAsync(f => f.Id != id && f.FarmerCode == dto.FarmerCode.Trim()))
        {
            return BadRequest(new { message = $"Farmer code '{dto.FarmerCode}' is already in use by another farmer." });
        }

        if (!string.IsNullOrWhiteSpace(dto.FarmerCode))
        {
            farmer.FarmerCode = dto.FarmerCode.Trim();
        }

        farmer.FarmerName = dto.FarmerName.Trim();
        farmer.FatherOrHusbandName = dto.FatherOrHusbandName?.Trim();
        farmer.Mobile = dto.Mobile.Trim();
        farmer.AlternateMobile = dto.AlternateMobile?.Trim();
        farmer.Email = dto.Email?.Trim();
        farmer.AadhaarNo = dto.AadhaarNo?.Trim();
        farmer.TotalLand = dto.TotalLand;
        farmer.Status = string.IsNullOrWhiteSpace(dto.Status) ? farmer.Status : dto.Status.Trim();
        farmer.Village = dto.Village?.Trim() ?? farmer.Village;
        farmer.Mandal = dto.Mandal?.Trim() ?? farmer.Mandal;
        farmer.District = dto.District?.Trim() ?? farmer.District;
        farmer.UpdatedAt = DateTime.UtcNow;

        if (dto.Address != null)
        {
            if (farmer.Address == null)
            {
                farmer.Address = new FarmerAddress
                {
                    FarmerId = farmer.Id,
                    Address = dto.Address.Address?.Trim(),
                    Village = dto.Address.Village.Trim(),
                    Mandal = dto.Address.Mandal.Trim(),
                    District = dto.Address.District.Trim(),
                    State = dto.Address.State.Trim(),
                    PinCode = dto.Address.PinCode.Trim()
                };
            }
            else
            {
                farmer.Address.Address = dto.Address.Address?.Trim();
                farmer.Address.Village = dto.Address.Village.Trim();
                farmer.Address.Mandal = dto.Address.Mandal.Trim();
                farmer.Address.District = dto.Address.District.Trim();
                farmer.Address.State = dto.Address.State.Trim();
                farmer.Address.PinCode = dto.Address.PinCode.Trim();
            }
        }

        if (dto.BankAccount != null)
        {
            if (farmer.BankAccount == null)
            {
                farmer.BankAccount = new FarmerBankAccount
                {
                    FarmerId = farmer.Id,
                    BankName = dto.BankAccount.BankName.Trim(),
                    AccountNumber = dto.BankAccount.AccountNumber.Trim(),
                    IFSC = dto.BankAccount.IFSC.Trim()
                };
            }
            else
            {
                farmer.BankAccount.BankName = dto.BankAccount.BankName.Trim();
                farmer.BankAccount.AccountNumber = dto.BankAccount.AccountNumber.Trim();
                farmer.BankAccount.IFSC = dto.BankAccount.IFSC.Trim();
            }
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // PATCH: /api/Farmers/{id}/status
    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateFarmerStatusDto dto)
    {
        var farmer = await _context.Farmers.FindAsync(id);
        if (farmer == null)
        {
            return NotFound(new { message = $"Farmer with ID {id} not found." });
        }

        farmer.Status = dto.Status.Trim();
        farmer.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Status updated successfully.", status = farmer.Status });
    }

    // DELETE: /api/Farmers/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteFarmer(int id)
    {
        var farmer = await _context.Farmers
            .Include(f => f.Farms)
            .Include(f => f.Address)
            .Include(f => f.BankAccount)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (farmer == null)
        {
            return NotFound(new { message = $"Farmer with ID {id} not found." });
        }

        if (farmer.Farms.Any())
        {
            return BadRequest(new { message = "Cannot delete farmer with active farms. Please delete or reassign associated farms first." });
        }

        _context.Farmers.Remove(farmer);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Farmer '{farmer.FarmerName}' (Code: {farmer.FarmerCode}) deleted successfully." });
    }

    private static FarmerDto MapToFarmerDto(Farmer f)
    {
        return new FarmerDto
        {
            Id = f.Id,
            FarmerCode = f.FarmerCode,
            FarmerName = f.FarmerName,
            FatherOrHusbandName = f.FatherOrHusbandName,
            Mobile = f.Mobile,
            AlternateMobile = f.AlternateMobile,
            Email = f.Email,
            AadhaarNo = f.AadhaarNo,
            Village = f.Village ?? f.Address?.Village,
            Mandal = f.Mandal ?? f.Address?.Mandal,
            District = f.District ?? f.Address?.District,
            TotalLand = f.TotalLand,
            Status = f.Status,
            TotalFarmsCount = f.Farms != null ? f.Farms.Count : 0,
            TotalLandAreaAcres = f.Farms != null
                ? f.Farms.SelectMany(farm => farm.LandDetails ?? Enumerable.Empty<FarmLandDetail>()).Sum(ld => ld.LandArea)
                : 0,
            CreatedAt = f.CreatedAt,
            UpdatedAt = f.UpdatedAt,
            Address = f.Address == null ? null : new FarmerAddressSummaryDto
            {
                Id = f.Address.Id,
                Address = f.Address.Address,
                Village = f.Address.Village ?? string.Empty,
                Mandal = f.Address.Mandal ?? string.Empty,
                District = f.Address.District ?? string.Empty,
                State = f.Address.State ?? string.Empty,
                PinCode = f.Address.PinCode ?? string.Empty
            },
            BankAccount = f.BankAccount == null ? null : new FarmerBankAccountSummaryDto
            {
                Id = f.BankAccount.Id,
                BankName = f.BankAccount.BankName ?? string.Empty,
                AccountNumber = f.BankAccount.AccountNumber ?? string.Empty,
                IFSC = f.BankAccount.IFSC ?? string.Empty
            }
        };
    }
}
