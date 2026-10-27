using System.ComponentModel.DataAnnotations;

namespace AgriMan.Api.DTOs
{
    public class CreateUserRequest
    {
        [Required(ErrorMessage = "Name is required.")]
        [MaxLength(100, ErrorMessage = "Name cannot exceed 100 characters.")]
        public string Name { get; set; } = "Priya Sharma";

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address (e.g. priya@gmail.com).")]
        [MaxLength(150, ErrorMessage = "Email cannot exceed 150 characters.")]
        public string Email { get; set; } = "priya@gmail.com";

        [Phone(ErrorMessage = "Invalid mobile number format.")]
        [MaxLength(25, ErrorMessage = "Mobile number cannot exceed 25 characters.")]
        public string? MobileNumber { get; set; } = "+91 98765 12340";

        public string? Mobile
        {
            get => MobileNumber;
            set => MobileNumber = value;
        }

        public string? Password { get; set; } = "AgriMan@2026";

        public List<string> Roles { get; set; } = new List<string> { "Manager" };

        public bool IsActive { get; set; } = true;

        public string? ProfilePhoto { get; set; }

        public string? Photo
        {
            get => ProfilePhoto;
            set => ProfilePhoto = value;
        }

        public List<string>? Permissions { get; set; }
    }
}
