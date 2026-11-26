using AgriMan.Unified.Api.DTOs.Crops;

namespace AgriMan.Unified.Api.Services.Crops;

public interface ICropProfitabilityService
{
    Task<CropProfitabilityOverviewDto> GetAllCropsProfitabilityAsync(
        CropProfitabilityQueryParameters parameters,
        CancellationToken cancellationToken = default);

    Task<CropProfitabilityItemDto?> GetCropProfitabilityByNameAsync(
        string cropName,
        CropProfitabilityQueryParameters parameters,
        CancellationToken cancellationToken = default);

    Task<CropProfitabilityItemDto?> GetCropProfitabilityByIdAsync(
        int cropId,
        CropProfitabilityQueryParameters parameters,
        CancellationToken cancellationToken = default);

    CropProfitabilityItemDto CalculateScenario(CropProfitabilityCalculationRequest request);

    Task<string> ExportCsvAsync(
        CropProfitabilityQueryParameters parameters,
        CancellationToken cancellationToken = default);
}
