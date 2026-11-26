using FarmManagementApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FarmManagementApi.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(FarmDbContext context, ILogger logger)
        {
            await FarmDbContext.EnsureInventorySchemaAsync(context);
            await SeedInventoryDataAsync(context, logger);
            await SeedSupplierDataAsync(context, logger);

            try
            {
                if (await context.Farmers.AnyAsync())
                {
                    if (!await context.Farmers.AnyAsync(f => f.Email == "gprathap922@gmail.com" || f.FarmerName == "Prathap G"))
                    {
                        var farmerPrathap = new Farmer
                        {
                            FarmerCode = "FARM-2024-000",
                            FarmerName = "Prathap G",
                            FatherOrHusbandName = "G. Narayana",
                            Mobile = "+91 98491 23456",
                            AlternateMobile = "9849123456",
                            Email = "gprathap922@gmail.com",
                            AadhaarNo = "369852147012",
                            TotalLand = 25.00m,
                            Status = "Active",
                            Village = "Kondapur",
                            Mandal = "Siddipet",
                            District = "Siddipet",
                            CreatedAt = DateTime.UtcNow,
                            Address = new FarmerAddress
                            {
                                Address = "Plot 1, Green Fields Agro Tech Road",
                                Village = "Kondapur",
                                Mandal = "Siddipet",
                                District = "Siddipet",
                                State = "Telangana",
                                PinCode = "502103"
                            },
                            BankAccount = new FarmerBankAccount
                            {
                                BankName = "State Bank of India",
                                AccountNumber = "20394857162",
                                IFSC = "SBIN0001045"
                            }
                        };
                        context.Farmers.Add(farmerPrathap);
                        await context.SaveChangesAsync();
                        logger.LogInformation("Farmer profile for Prathap G ensured.");
                    }
                    logger.LogInformation("Database already contains farmer records. Skipping full seed.");
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

        public static async Task SeedSupplierDataAsync(FarmDbContext context, ILogger logger)
        {
            try
            {
                if (!await context.SupplierTransactions.AnyAsync())
                {
                    var s1 = await context.Suppliers.FirstOrDefaultAsync(s => s.SupplierCode == "SUP-001" || s.Id == 1);
                    var s2 = await context.Suppliers.FirstOrDefaultAsync(s => s.SupplierCode == "SUP-002" || s.Id == 2);
                    var s3 = await context.Suppliers.FirstOrDefaultAsync(s => s.SupplierCode == "SUP-003" || s.Id == 3);

                    if (s1 != null)
                    {
                        context.SupplierTransactions.Add(new SupplierTransaction
                        {
                            TransactionCode = "STX-001",
                            TransactionDate = new DateTime(2026, 10, 15),
                            SupplierId = s1.Id,
                            SupplierName = s1.SupplierName,
                            TransactionType = "Purchase",
                            ReferenceNo = "INV-NSC-4421",
                            Category = "Seeds",
                            ItemsSummary = "Paddy Seeds (BPT 5204 Samba Masuri) - 25 Bags @ ₹850",
                            Amount = 21250m,
                            PaidAmount = 21250m,
                            BalanceAmount = 0m,
                            PaymentStatus = "Paid",
                            Notes = "Kharif season seed stock delivery verified",
                            CreatedAt = DateTime.UtcNow
                        });

                        context.SupplierPayments.Add(new SupplierPayment
                        {
                            PaymentCode = "SPY-001",
                            PaymentDate = new DateTime(2026, 10, 16),
                            SupplierId = s1.Id,
                            SupplierName = s1.SupplierName,
                            AmountPaid = 21250m,
                            PaymentMode = "Bank Transfer",
                            ReferenceNo = "UTR-SBI-99238472",
                            BankAccount = "SBI Farm Operational A/C - 8812",
                            Notes = "Full settlement for invoice INV-NSC-4421",
                            CreatedAt = DateTime.UtcNow
                        });
                    }

                    if (s2 != null)
                    {
                        context.SupplierTransactions.Add(new SupplierTransaction
                        {
                            TransactionCode = "STX-002",
                            TransactionDate = new DateTime(2026, 10, 18),
                            SupplierId = s2.Id,
                            SupplierName = s2.SupplierName,
                            TransactionType = "Purchase",
                            ReferenceNo = "INV-IFFCO-891",
                            Category = "Fertilizers",
                            ItemsSummary = "Urea Granular Fertilizer (45kg) - 50 Bags @ ₹270",
                            Amount = 13500m,
                            PaidAmount = 13500m,
                            BalanceAmount = 0m,
                            PaymentStatus = "Paid",
                            Notes = "Delivered directly to Farm 1 storage godown",
                            CreatedAt = DateTime.UtcNow
                        });

                        context.SupplierPayments.Add(new SupplierPayment
                        {
                            PaymentCode = "SPY-002",
                            PaymentDate = new DateTime(2026, 10, 20),
                            SupplierId = s2.Id,
                            SupplierName = s2.SupplierName,
                            AmountPaid = 13500m,
                            PaymentMode = "UPI",
                            ReferenceNo = "UPI-984912-332",
                            BankAccount = "SBI Farm Operational A/C - 8812",
                            Notes = "Settlement for invoice INV-IFFCO-891 via UPI",
                            CreatedAt = DateTime.UtcNow
                        });
                    }

                    if (s3 != null)
                    {
                        context.SupplierTransactions.Add(new SupplierTransaction
                        {
                            TransactionCode = "STX-003",
                            TransactionDate = new DateTime(2026, 10, 22),
                            SupplierId = s3.Id,
                            SupplierName = s3.SupplierName,
                            TransactionType = "Purchase",
                            ReferenceNo = "INV-CORO-312",
                            Category = "Fertilizers",
                            ItemsSummary = "DAP Complex (50kg) - 30 Bags @ ₹1,350",
                            Amount = 40500m,
                            PaidAmount = 25000m,
                            BalanceAmount = 15500m,
                            PaymentStatus = "Partially Paid",
                            Notes = "Partial payment released, balance due upon final field application",
                            CreatedAt = DateTime.UtcNow
                        });

                        context.SupplierPayments.Add(new SupplierPayment
                        {
                            PaymentCode = "SPY-003",
                            PaymentDate = new DateTime(2026, 10, 24),
                            SupplierId = s3.Id,
                            SupplierName = s3.SupplierName,
                            AmountPaid = 25000m,
                            PaymentMode = "Bank Transfer",
                            ReferenceNo = "UTR-HDFC-88123049",
                            BankAccount = "HDFC Agri Business A/C - 4102",
                            Notes = "Part payment for DAP shipment INV-CORO-312",
                            CreatedAt = DateTime.UtcNow
                        });
                    }

                    await context.SaveChangesAsync();
                    logger.LogInformation("Database seeded with sample Supplier Transactions and Payments.");
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning("Supplier seed notice: {Message}", ex.Message);
            }
        }

        public static async Task SeedInventoryDataAsync(FarmDbContext context, ILogger logger)
        {
            try
            {
                // 1. Seed Product Categories (idempotent)
                var defaultCategories = new List<(string Name, string Description)>
                {
                    ("Seeds", "Agricultural crop seeds, hybrid varieties, and certified saplings"),
                    ("Fertilizers", "Chemical, organic, and complex plant nutrients"),
                    ("Pesticides", "Chemical insecticides, fungicides, and herbicides for pest control"),
                    ("Sprayer Chemicals", "Specialized liquid sprays, adjuvants, and micronutrients"),
                    ("Spare Parts", "Tractor, tiller, irrigation pump, and sprayer spare parts"),
                    ("Consumables", "Drip lateral pipes, ropes, tarpaulins, and farm consumables")
                };

                var existingCategories = await context.ProductCategories.ToListAsync();
                var catMap = new Dictionary<string, ProductCategory>(StringComparer.OrdinalIgnoreCase);
                foreach (var c in existingCategories)
                {
                    catMap[c.Name] = c;
                }

                bool catChanged = false;
                foreach (var (name, desc) in defaultCategories)
                {
                    if (!catMap.ContainsKey(name))
                    {
                        var newCat = new ProductCategory
                        {
                            Name = name,
                            Description = desc,
                            IsActive = true
                        };
                        context.ProductCategories.Add(newCat);
                        catMap[name] = newCat;
                        catChanged = true;
                    }
                }

                if (catChanged)
                {
                    await context.SaveChangesAsync();
                }

                // 2. Seed Units (idempotent)
                var defaultUnits = new List<(string Name, string ShortCode)>
                {
                    ("Kilograms", "kg"),
                    ("Bags", "Bags"),
                    ("Litre", "Litre"),
                    ("Quintals", "Quintals"),
                    ("Packets", "Packets")
                };

                var existingUnits = await context.Units.ToListAsync();
                var unitMap = new Dictionary<string, Units>(StringComparer.OrdinalIgnoreCase);
                foreach (var u in existingUnits)
                {
                    unitMap[u.ShortCode] = u;
                    unitMap[u.Name] = u;
                }

                bool unitsChanged = false;
                foreach (var (name, shortCode) in defaultUnits)
                {
                    if (!unitMap.ContainsKey(shortCode) && !unitMap.ContainsKey(name))
                    {
                        var newUnit = new Units
                        {
                            Name = name,
                            ShortCode = shortCode,
                            IsActive = true
                        };
                        context.Units.Add(newUnit);
                        unitMap[shortCode] = newUnit;
                        unitMap[name] = newUnit;
                        unitsChanged = true;
                    }
                }

                if (unitsChanged)
                {
                    await context.SaveChangesAsync();
                }

                // 3. Seed Sample Products and Initial Stock
                if (!await context.Products.AnyAsync())
                {
                    logger.LogInformation("Seeding default agricultural inventory products and initial stock...");

                    var seedsCat = catMap.GetValueOrDefault("Seeds")?.Id ?? 1;
                    var fertCat = catMap.GetValueOrDefault("Fertilizers")?.Id ?? 2;
                    var pestCat = catMap.GetValueOrDefault("Pesticides")?.Id ?? 3;
                    var sprayCat = catMap.GetValueOrDefault("Sprayer Chemicals")?.Id ?? 4;
                    var spareCat = catMap.GetValueOrDefault("Spare Parts")?.Id ?? 5;
                    var consCat = catMap.GetValueOrDefault("Consumables")?.Id ?? 6;

                    var kgId = unitMap.GetValueOrDefault("kg")?.Id ?? 1;
                    var bagId = unitMap.GetValueOrDefault("Bags")?.Id ?? (unitMap.GetValueOrDefault("bag")?.Id ?? 2);
                    var litreId = unitMap.GetValueOrDefault("Litre")?.Id ?? (unitMap.GetValueOrDefault("L")?.Id ?? 3);
                    var quintalId = unitMap.GetValueOrDefault("Quintals")?.Id ?? (unitMap.GetValueOrDefault("qtl")?.Id ?? 4);
                    var packetId = unitMap.GetValueOrDefault("Packets")?.Id ?? (unitMap.GetValueOrDefault("pkt")?.Id ?? 5);

                    var sampleProducts = new List<(string Code, string Name, int CatId, int UnitId, decimal Reorder, decimal Cost, decimal Stock)>
                    {
                        ("PRD-001", "Paddy Certified Seeds (BPT 5204 Samba Masuri)", seedsCat, bagId, 10m, 850.00m, 50m),
                        ("PRD-002", "Urea Fertilizer Granular (45kg)", fertCat, bagId, 25m, 270.00m, 100m),
                        ("PRD-003", "DAP Complex Fertilizer 18-46-0 (50kg)", fertCat, bagId, 15m, 1350.00m, 40m),
                        ("PRD-004", "Chlorpyrifos 20% EC Insecticide", pestCat, litreId, 5m, 480.00m, 25m),
                        ("PRD-005", "Glyphosate 41% SL Sprayer Chemical", sprayCat, litreId, 8m, 550.00m, 30m),
                        ("PRD-006", "Mahindra Tractor Oil Filter Cartridge", spareCat, packetId, 4m, 450.00m, 15m),
                        ("PRD-007", "Drip Lateral Pipe 16mm (100m Roll)", consCat, packetId, 3m, 1650.00m, 10m),
                        ("PRD-008", "Cotton Hybrid Seeds (Kaveri Jadu)", seedsCat, packetId, 10m, 920.00m, 35m)
                    };

                    var productsToAdd = new List<Products>();
                    foreach (var sp in sampleProducts)
                    {
                        var prod = new Products
                        {
                            Code = sp.Code,
                            Name = sp.Name,
                            CategoryId = sp.CatId,
                            UnitId = sp.UnitId,
                            ReorderLevel = sp.Reorder,
                            StandardCost = sp.Cost,
                            IsActive = true
                        };
                        productsToAdd.Add(prod);
                    }

                    context.Products.AddRange(productsToAdd);
                    await context.SaveChangesAsync();

                    // Seed corresponding inventory and ledger transactions
                    foreach (var (prod, sp) in productsToAdd.Zip(sampleProducts, (p, s) => (p, s)))
                    {
                        context.Inventory.Add(new Inventory
                        {
                            ProductId = prod.Id,
                            StorageLocation = "Main Warehouse",
                            CurrentStock = sp.Stock,
                            ReservedStock = 0,
                            LastUpdated = DateTime.UtcNow
                        });

                        context.InventoryTransactions.Add(new InventoryTransaction
                        {
                            ProductId = prod.Id,
                            TransactionDate = DateTime.UtcNow,
                            TransactionType = "StockIn",
                            Quantity = sp.Stock,
                            UnitPrice = prod.StandardCost,
                            StorageLocation = "Main Warehouse",
                            ReferenceType = "InitialStock",
                            ReferenceNumber = $"INIT-{prod.Code}",
                            Notes = "Initial balance seeded for warehouse operations",
                            BalanceAfterTransaction = sp.Stock
                        });
                    }

                    await context.SaveChangesAsync();
                    logger.LogInformation("Database seeded with sample Products and initial stock transactions.");
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning("Inventory seed notice: {Message}", ex.Message);
            }
        }
    }
}
