using System.ComponentModel.DataAnnotations;

namespace AgriMan.Api.DTOs
{
    public class CompanySettingResponseDto
    {
        public int Id { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public string? PostalCode { get; set; }
        public string? TaxNumber { get; set; }
        public string Currency { get; set; } = "INR";
        public string Timezone { get; set; } = "Asia/Kolkata";
        public string? Website { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UpdateCompanySettingDto
    {
        [Required(ErrorMessage = "Company name is required.")]
        [MaxLength(150)]
        public string CompanyName { get; set; } = string.Empty;

        [MaxLength(150)]
        public string? Email { get; set; }

        [MaxLength(30)]
        public string? Phone { get; set; }

        [MaxLength(255)]
        public string? Address { get; set; }

        [MaxLength(100)]
        public string? City { get; set; }

        [MaxLength(100)]
        public string? Country { get; set; }

        [MaxLength(20)]
        public string? PostalCode { get; set; }

        [MaxLength(50)]
        public string? TaxNumber { get; set; }

        [MaxLength(10)]
        public string? Currency { get; set; }

        [MaxLength(50)]
        public string? Timezone { get; set; }

        [MaxLength(255)]
        public string? Website { get; set; }
    }
}
