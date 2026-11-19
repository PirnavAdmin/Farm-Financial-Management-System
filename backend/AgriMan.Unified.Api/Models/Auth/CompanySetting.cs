using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AgriMan.Api.Models
{
    [Table("company_settings")]
    public class CompanySetting
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(150)]
        public string CompanyName { get; set; } = "AGRIMAN Farms Pvt Ltd";

        [MaxLength(150)]
        [EmailAddress]
        public string? Email { get; set; } = "contact@agriman.in";

        [MaxLength(30)]
        public string? Phone { get; set; } = "+91 98765 00000";

        [MaxLength(255)]
        public string? Address { get; set; } = "Plot 42, Green Agro Tech Park, Farm City";

        [MaxLength(100)]
        public string? City { get; set; } = "Hyderabad";

        [MaxLength(100)]
        public string? Country { get; set; } = "India";

        [MaxLength(20)]
        public string? PostalCode { get; set; } = "500081";

        [MaxLength(50)]
        public string? TaxNumber { get; set; } = "GSTIN36AABCA1234F1Z5";

        [MaxLength(10)]
        public string Currency { get; set; } = "INR";

        [MaxLength(50)]
        public string Timezone { get; set; } = "Asia/Kolkata";

        [MaxLength(255)]
        public string? Website { get; set; } = "https://agriman.in";

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
