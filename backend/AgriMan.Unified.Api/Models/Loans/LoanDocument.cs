using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models
{
    [Table("loan_documents")]
    public class LoanDocument
    {
        [Key]
        public int Id { get; set; }

        public int LoanId { get; set; }

        [Required]
        [MaxLength(200)]
        public string DocumentName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string DocumentType { get; set; } = "Sanction Letter"; // Sanction Letter, Agreement, Promissory Note, Closure Certificate, Other

        [Required]
        [MaxLength(500)]
        public string FileUrl { get; set; } = string.Empty;

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("LoanId")]
        public virtual Loan? Loan { get; set; }
    }
}
