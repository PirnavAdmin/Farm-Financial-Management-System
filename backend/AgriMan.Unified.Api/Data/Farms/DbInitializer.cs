using FarmManagementApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FarmManagementApi.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(FarmDbContext context, ILogger logger)
        {
            try
            {
                if (await context.Farmers.AnyAsync())
                {
                    logger.LogInformation("Database already contains farmer records. Skipping seed.");
                    return;
                }

                logger.LogInformation("Seeding initial farmers, farms, land details, addresses, and bank accounts...");

                var seedDate = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc);

                var farmer1 = new Farmer
                {
                    FarmerCode = "FARM-2024-001",
                    FarmerName = "Ramesh Kumar Patel",
                    FatherOrHusbandName = "Harish Patel",
                    Mobile = "9876543210",
                    AlternateMobile = "9876543211",
                    Email = "ramesh.patel@agrimail.com",
                    AadhaarNo = "123456789012",
                    TotalLand = 12.50m,
                    Status = "Active",
                    Village = "Kothapally",
                    Mandal = "Siddipet",
                    District = "Siddipet",
                    CreatedAt = seedDate,
                    Address = new FarmerAddress
                    {
                        Address = "Plot 45, Near Cooperative Society",
                        Village = "Kothapally",
                        Mandal = "Siddipet",
                        District = "Siddipet",
                        State = "Telangana",
                        PinCode = "502103"
                    },
                    BankAccount = new FarmerBankAccount
                    {
                        BankName = "State Bank of India",
                        AccountNumber = "30987654321",
                        IFSC = "SBIN0001234"
                    }
                };

                var farmer2 = new Farmer
                {
                    FarmerCode = "FARM-2024-002",
                    FarmerName = "Suresh Verma",
                    FatherOrHusbandName = "Devendra Verma",
                    Mobile = "9123456780",
                    AlternateMobile = "9123456789",
                    Email = "suresh.v@gmail.com",
                    AadhaarNo = "987654321098",
                    TotalLand = 8.75m,
                    Status = "Active",
                    Village = "Narsapur",
                    Mandal = "Medak",
                    District = "Medak",
                    CreatedAt = seedDate.AddDays(5),
                    Address = new FarmerAddress
                    {
                        Address = "H.No 3-12, Gram Panchayat Road",
                        Village = "Narsapur",
                        Mandal = "Medak",
                        District = "Medak",
                        State = "Telangana",
                        PinCode = "502313"
                    },
                    BankAccount = new FarmerBankAccount
                    {
                        BankName = "HDFC Bank",
                        AccountNumber = "5010023456789",
                        IFSC = "HDFC0000456"
                    }
                };

                var farmer3 = new Farmer
                {
                    FarmerCode = "FARM-2024-003",
                    FarmerName = "Shyam Sundar Reddy",
                    FatherOrHusbandName = "Ramana Reddy",
                    Mobile = "9876500001",
                    AlternateMobile = "9876500002",
                    Email = "shyam.reddy@agriman.in",
                    AadhaarNo = "543289012345",
                    TotalLand = 10.50m,
                    Status = "Active",
                    Village = "Kondapur",
                    Mandal = "Medak",
                    District = "Medak",
                    CreatedAt = seedDate.AddDays(10),
                    Address = new FarmerAddress
                    {
                        Address = "Main Road, Near Hanuman Temple",
                        Village = "Kondapur",
                        Mandal = "Medak",
                        District = "Medak",
                        State = "Telangana",
                        PinCode = "502110"
                    },
                    BankAccount = new FarmerBankAccount
                    {
                        BankName = "Andhra Pradesh Grameena Vikas Bank",
                        AccountNumber = "7766554433221",
                        IFSC = "APGV0001045"
                    }
                };

                var farmer4 = new Farmer
                {
                    FarmerCode = "FARM-2024-004",
                    FarmerName = "Anitha Rao",
                    FatherOrHusbandName = "Venkata Rao",
                    Mobile = "9988776655",
                    AlternateMobile = null,
                    Email = "anitha.rao@yahoo.com",
                    AadhaarNo = "456789012345",
                    TotalLand = 15.00m,
                    Status = "Active",
                    Village = "Alwal",
                    Mandal = "Malkajgiri",
                    District = "Medchal-Malkajgiri",
                    CreatedAt = seedDate.AddDays(15),
                    Address = new FarmerAddress
                    {
                        Address = "Field Station Road",
                        Village = "Alwal",
                        Mandal = "Malkajgiri",
                        District = "Medchal-Malkajgiri",
                        State = "Telangana",
                        PinCode = "500010"
                    },
                    BankAccount = new FarmerBankAccount
                    {
                        BankName = "Union Bank of India",
                        AccountNumber = "1023456789012",
                        IFSC = "UBIN0532109"
                    }
                };

                context.Farmers.AddRange(farmer1, farmer2, farmer3, farmer4);
                await context.SaveChangesAsync();

                // Seed Farms for the seeded farmers
                var farm1 = new Farm
                {
                    FarmerId = farmer1.Id,
                    FarmName = "Green Valley Plot",
                    OwnershipType = "Owned",
                    Village = "Kothapally",
                    Mandal = "Siddipet",
                    District = "Siddipet",
                    Status = "Active",
                    CreatedAt = seedDate
                };

                var farm2 = new Farm
                {
                    FarmerId = farmer2.Id,
                    FarmName = "Sunrise Agro Farm",
                    OwnershipType = "Owned",
                    Village = "Narsapur",
                    Mandal = "Medak",
                    District = "Medak",
                    Status = "Active",
                    CreatedAt = seedDate
                };

                var farm3 = new Farm
                {
                    FarmerId = farmer3.Id,
                    FarmName = "Shyam North Farm",
                    OwnershipType = "Owned",
                    Village = "Kondapur",
                    Mandal = "Medak",
                    District = "Medak",
                    Status = "Active",
                    CreatedAt = seedDate
                };

                context.Farms.AddRange(farm1, farm2, farm3);
                await context.SaveChangesAsync();

                // Seed Land Details
                var land1 = new FarmLandDetail
                {
                    FarmId = farm1.Id,
                    SurveyNumber = "123/A",
                    LandArea = 5.00m,
                    AreaUnit = "Acres",
                    LandType = "Agricultural",
                    IrrigationSourceId = 1, // Borewell
                    SoilTypeId = 1,         // Black Soil
                    BoundariesNorth = "Rao Plot",
                    BoundariesSouth = "Main Village Road",
                    BoundariesEast = "Irrigation Canal",
                    BoundariesWest = "Government Land",
                    Remarks = "Fertile black cotton soil with high yield borewell",
                    CreatedAt = seedDate
                };

                var land2 = new FarmLandDetail
                {
                    FarmId = farm2.Id,
                    SurveyNumber = "125/B",
                    LandArea = 3.50m,
                    AreaUnit = "Acres",
                    LandType = "Agricultural",
                    IrrigationSourceId = 2, // Canal
                    SoilTypeId = 2,         // Red Soil
                    BoundariesNorth = "Canal Embankment",
                    BoundariesSouth = "Paddy Fields",
                    BoundariesEast = "Survey 125/C",
                    BoundariesWest = "Cart Track",
                    Remarks = "Gravity flow canal water available 6 months per year",
                    CreatedAt = seedDate
                };

                var land3 = new FarmLandDetail
                {
                    FarmId = farm3.Id,
                    SurveyNumber = "88/1",
                    LandArea = 6.00m,
                    AreaUnit = "Acres",
                    LandType = "Agricultural",
                    IrrigationSourceId = 3, // Drip
                    SoilTypeId = 3,         // Alluvial Soil
                    Remarks = "River Krishna basin fertile horticulture plot",
                    CreatedAt = seedDate
                };

                context.FarmLandDetails.AddRange(land1, land2, land3);
                await context.SaveChangesAsync();

                // Seed sample Document
                var doc1 = new FarmDocument
                {
                    FarmId = farm1.Id,
                    DocumentType = "Pattadar Passbook",
                    DocumentNumber = "PPB-2024-AP-1049",
                    FileName = "ramesh_patel_passbook_123a.pdf",
                    FileUrl = "/uploads/documents/ramesh_patel_passbook_123a.pdf",
                    FileSize = 1048576,
                    UploadedAt = seedDate
                };
                context.FarmDocuments.Add(doc1);
                await context.SaveChangesAsync();

                logger.LogInformation("Database seeded successfully with 4 sample farmers, farms, land parcels, addresses, and bank accounts.");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Could not initialize/seed FarmDbContext automatically: {Message}", ex.Message);
            }
        }
    }
}
