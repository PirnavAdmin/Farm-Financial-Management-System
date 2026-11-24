using FarmManagementApi.DTOs;

namespace FarmManagementApi.Services;

public interface IInventoryService
{
    // Product Categories
    Task<ServiceResult<List<ProductCategoryDto>>> GetCategoriesAsync(bool? isActive = null, string? search = null);
    Task<ServiceResult<ProductCategoryDto>> GetCategoryByIdAsync(int id);
    Task<ServiceResult<ProductCategoryDto>> CreateCategoryAsync(CreateProductCategoryDto dto, int? actorUserId = null, string? actorName = null, string? ipAddress = null);
    Task<ServiceResult<ProductCategoryDto>> UpdateCategoryAsync(int id, UpdateProductCategoryDto dto, int? actorUserId = null, string? actorName = null, string? ipAddress = null);
    Task<ServiceResult<bool>> DeleteCategoryAsync(int id, int? actorUserId = null, string? actorName = null, string? ipAddress = null);

    // Units
    Task<ServiceResult<List<UnitDto>>> GetUnitsAsync(bool? isActive = null, string? search = null);
    Task<ServiceResult<UnitDto>> GetUnitByIdAsync(int id);
    Task<ServiceResult<UnitDto>> CreateUnitAsync(CreateUnitDto dto, int? actorUserId = null, string? actorName = null, string? ipAddress = null);
    Task<ServiceResult<UnitDto>> UpdateUnitAsync(int id, UpdateUnitDto dto, int? actorUserId = null, string? actorName = null, string? ipAddress = null);
    Task<ServiceResult<bool>> DeleteUnitAsync(int id, int? actorUserId = null, string? actorName = null, string? ipAddress = null);

    // Products
    Task<ServiceResult<PaginatedProductsResponse>> GetProductsAsync(int? categoryId = null, int? unitId = null, bool? isActive = null, string? search = null, int page = 1, int pageSize = 20);
    Task<ServiceResult<ProductDetailDto>> GetProductByIdAsync(int id);
    Task<ServiceResult<ProductDetailDto>> CreateProductAsync(CreateProductDto dto, int? actorUserId = null, string? actorName = null, string? ipAddress = null);
    Task<ServiceResult<ProductDetailDto>> UpdateProductAsync(int id, UpdateProductDto dto, int? actorUserId = null, string? actorName = null, string? ipAddress = null);
    Task<ServiceResult<ProductDetailDto>> UpdateProductStatusAsync(int id, bool isActive, int? actorUserId = null, string? actorName = null, string? ipAddress = null);
    Task<ServiceResult<bool>> DeleteProductAsync(int id, int? actorUserId = null, string? actorName = null, string? ipAddress = null);
    Task<string> GenerateNextProductCodeAsync();
}
