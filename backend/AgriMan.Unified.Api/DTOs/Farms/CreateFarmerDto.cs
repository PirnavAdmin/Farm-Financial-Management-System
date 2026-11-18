using System.ComponentModel.DataAnnotations;

namespace FarmManagementApi.DTOs
{
    public class CreateFarmerDto
    {
        [StringLength(50, ErrorMessage = "Farmer Code cannot exceed 50 characters")]
        public string? FarmerCode { get; set; }

        [Required(ErrorMessage = "Farmer Name is required")]
        [StringLength(150, ErrorMessage = "Farmer Name cannot exceed 150 characters")]
        public string FarmerName { get; set; } = string.Empty;

        public string? FullName
        {
            get => FarmerName;
            set { if (!string.IsNullOrWhiteSpace(value)) FarmerName = value; }
        }

        [StringLength(100, ErrorMessage = "Father/Husband Name cannot exceed 100 characters")]
        public string? FatherOrHusbandName { get; set; }

        [Required(ErrorMessage = "Mobile number is required")]
        [StringLength(20, ErrorMessage = "Mobile cannot exceed 20 characters")]
        public string Mobile { get; set; } = string.Empty;

        public string? PhoneNumber
        {
            get => Mobile;
            set { if (!string.IsNullOrWhiteSpace(value)) Mobile = value; }
        }

        [StringLength(20, ErrorMessage = "Alternate Mobile cannot exceed 20 characters")]
        public string? AlternateMobile { get; set; }

        [EmailAddress(ErrorMessage = "Invalid email address format")]
        [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
        public string? Email { get; set; }

        [StringLength(20, ErrorMessage = "Aadhaar number cannot exceed 20 characters")]
        public string? AadhaarNo { get; set; }

        public string? AadhaarNumber
        {
            get => AadhaarNo;
            set => AadhaarNo = value;
        }

        [StringLength(100)]
        public string? Village { get; set; }

        [StringLength(100)]
        public string? Mandal { get; set; }

        [StringLength(100)]
        public string? District { get; set; }

        [Range(0, 999999.99, ErrorMessage = "Total Land must be a valid positive value")]
        public decimal TotalLand { get; set; }

        [StringLength(20)]
        public string Status { get; set; } = "Active";

        // Optional embedded Address and Bank Account for 1-step farmer creation
        public CreateFarmerAddressDto? Address { get; set; }
        public CreateFarmerBankAccountDto? BankAccount { get; set; }
    }

    public class UpdateFarmerStatusDto
    {
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Active";
    }
}
