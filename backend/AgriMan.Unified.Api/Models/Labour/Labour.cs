using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models
{
    [Table("labours")]
    public class Labour
    {
        [Key]
        [Column("id")]
        public ulong Id { get; set; }

        [Column("labour_code")]
        [MaxLength(50)]
        public string LabourCode { get; set; } = string.Empty;

        [Column("labour_name")]
        [MaxLength(150)]
        public string LabourName { get; set; } = string.Empty;

        [Column("mobile")]
        [MaxLength(15)]
        public string Mobile { get; set; } = string.Empty;

        [Column("gender")]
        [MaxLength(20)]
        public string Gender { get; set; } = "Male";

        [Column("village")]
        [MaxLength(100)]
        public string Village { get; set; } = string.Empty;

        [Column("daily_rate")]
        public decimal DailyRate { get; set; } = 400.00m;

        [Column("status")]
        [MaxLength(20)]
        public string Status { get; set; } = "Active";

        [Column("photo")]
        public string? Photo { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }

    [Table("labour_work_types")]
    public class LabourWorkType
    {
        [Key]
        [Column("id")]
        public ulong Id { get; set; }

        [Column("code")]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [Column("work_type_name")]
        [MaxLength(100)]
        public string WorkTypeName { get; set; } = string.Empty;

        [Column("default_rate")]
        public decimal DefaultRate { get; set; } = 450.00m;

        [Column("unit")]
        [MaxLength(20)]
        public string Unit { get; set; } = "Day";

        [Column("description")]
        public string? Description { get; set; }

        [Column("status")]
        [MaxLength(20)]
        public string Status { get; set; } = "Active";

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    }

    [Table("labour_attendance")]
    public class LabourAttendance
    {
        [Key]
        [Column("id")]
        public ulong Id { get; set; }

        [Column("attendance_code")]
        [MaxLength(50)]
        public string AttendanceCode { get; set; } = string.Empty;

        [Column("attendance_date")]
        public DateTime AttendanceDate { get; set; }

        [Column("labour_id")]
        public ulong LabourId { get; set; }

        [Column("farm_name")]
        [MaxLength(100)]
        public string FarmName { get; set; } = string.Empty;

        [Column("crop_name")]
        [MaxLength(100)]
        public string CropName { get; set; } = string.Empty;

        [Column("work_type")]
        [MaxLength(100)]
        public string WorkType { get; set; } = string.Empty;

        [Column("work_basis")]
        [MaxLength(20)]
        public string WorkBasis { get; set; } = "Days";

        [Column("units_worked")]
        public decimal UnitsWorked { get; set; } = 1.00m;

        [Column("rate")]
        public decimal Rate { get; set; }

        [Column("calculated_amount")]
        public decimal CalculatedAmount { get; set; }

        [Column("amount")]
        public decimal Amount { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    }

    [Table("labour_payments")]
    public class LabourPayment
    {
        [Key]
        [Column("id")]
        public ulong Id { get; set; }

        [Column("payment_code")]
        [MaxLength(50)]
        public string PaymentCode { get; set; } = string.Empty;

        [Column("payment_date")]
        public DateTime PaymentDate { get; set; }

        [Column("labour_id")]
        public ulong LabourId { get; set; }

        [Column("amount_paid")]
        public decimal AmountPaid { get; set; }

        [Column("payment_mode")]
        [MaxLength(50)]
        public string PaymentMode { get; set; } = "Cash";

        [Column("reference_no")]
        [MaxLength(100)]
        public string? ReferenceNo { get; set; }

        [Column("period_start")]
        public DateTime? PeriodStart { get; set; }

        [Column("period_end")]
        public DateTime? PeriodEnd { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
