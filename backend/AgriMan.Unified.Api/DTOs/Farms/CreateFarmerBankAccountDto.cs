using System.ComponentModel.DataAnnotations;

namespace FarmManagementApi.DTOs
{
    public class CreateFarmerBankAccountDto
    {
        [Required(ErrorMessage = "Farmer ID is required")]
        public int FarmerId { get; set; }

        [Required(ErrorMessage = "Bank Name is required")]
        [StringLength(100, ErrorMessage = "Bank Name cannot exceed 100 characters")]
        public string BankName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Account Number is required")]
        [StringLength(50, ErrorMessage = "Account Number cannot exceed 50 characters")]
        public string AccountNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "IFSC code is required")]
        [StringLength(20, ErrorMessage = "IFSC code cannot exceed 20 characters")]
        public string IFSC { get; set; } = string.Empty;
    }
}
