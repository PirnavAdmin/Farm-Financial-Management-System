using System;
using System.Collections.Generic;

namespace FarmManagementApi.Models
{
    public class Supplier
    {
        public long Id { get; set; }
        public int FarmerId { get; set; }
        public Farmer Farmer { get; set; } = null!;

        public string Name { get; set; } = string.Empty;
        public string? ContactPerson { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? GstNumber { get; set; }

        public ICollection<Purchase> Purchases { get; set; } = new List<Purchase>();
    }
}