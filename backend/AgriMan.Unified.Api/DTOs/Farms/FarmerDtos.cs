using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FarmManagementApi.DTOs;

public class FarmerDto
{
    public int Id { get; set; }
    public string FarmerCode { get; set; } = string.Empty;
    public string FarmerName { get; set; } = string.Empty;
    public string FullName
    {
        get => FarmerName;
        set => FarmerName = value;
    }
    public string? FatherOrHusbandName { get; set; }
    public string Mobile { get; set; } = string.Empty;
    public string? PhoneNumber
    {
        get => Mobile;
        set => Mobile = value ?? string.Empty;
    }
    public string? AlternateMobile { get; set; }
    public string? Email { get; set; }
    public string? AadhaarNo { get; set; }
    public string? AadhaarNumber
    {
        get => AadhaarNo;
        set => AadhaarNo = value;
    }
    public string? Village { get; set; }
    public string? Mandal { get; set; }
    public string? District { get; set; }
    public decimal TotalLand { get; set; }
    public string Status { get; set; } = "Active";
    public int TotalFarmsCount { get; set; }
    public decimal TotalLandAreaAcres { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public FarmerAddressSummaryDto? Address { get; set; }
    public FarmerBankAccountSummaryDto? BankAccount { get; set; }
}

public class FarmerAddressSummaryDto
{
    public int Id { get; set; }
    public string? Address { get; set; }
    public string Village { get; set; } = string.Empty;
    public string Mandal { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PinCode { get; set; } = string.Empty;
}

public class FarmerBankAccountSummaryDto
{
    public int Id { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string IFSC { get; set; } = string.Empty;
}

public class FarmerWithLandsDto
{
    public int FarmerId { get; set; }
    public string FarmerName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Village { get; set; }
    public string? Mandal { get; set; }
    public string? District { get; set; }
    public List<FarmerFarmSummaryDto> Farms { get; set; } = new();
}

public class FarmerFarmSummaryDto
{
    public int FarmId { get; set; }
    public string FarmName { get; set; } = string.Empty;
    public string OwnershipType { get; set; } = string.Empty;
    public string Village { get; set; } = string.Empty;
    public string Mandal { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    public List<LandDetailDto> Lands { get; set; } = new();
}

public class CreateFarmerRequest
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    public string? FarmerCode { get; set; }

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(20)]
    public string? AadhaarNumber { get; set; }

    [MaxLength(100)]
    public string? Village { get; set; }

    [MaxLength(100)]
    public string? Mandal { get; set; }

    [MaxLength(100)]
    public string? District { get; set; }

    public decimal? TotalLand { get; set; }
}

public class UpdateFarmerRequest
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(20)]
    public string? AadhaarNumber { get; set; }

    [MaxLength(100)]
    public string? Village { get; set; }

    [MaxLength(100)]
    public string? Mandal { get; set; }

    [MaxLength(100)]
    public string? District { get; set; }

    public decimal? TotalLand { get; set; }
}
