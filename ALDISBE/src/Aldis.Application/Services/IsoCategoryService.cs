using Aldis.Application.Interfaces.Repositories;
using Aldis.Application.Interfaces.Services;
using Aldis.Contracts.Categories;
using Aldis.Contracts.Common;

namespace Aldis.Application.Services;

public class IsoCategoryService : IIsoCategoryService
{
    private readonly IIsoCategoryRepository _isoCategoryRepository;

    public IsoCategoryService(IIsoCategoryRepository isoCategoryRepository)
    {
        _isoCategoryRepository = isoCategoryRepository;
    }

    public async Task<ApiResponse<IEnumerable<IsoCategoryResponse>>> GetAllIsoCategoriesAsync(CancellationToken cancellationToken = default)
    {
        var categories = await _isoCategoryRepository.GetAllIsoCategoriesAsync(cancellationToken);
        return ApiResponse<IEnumerable<IsoCategoryResponse>>.Ok(categories);
    }

    public async Task<ApiResponse<int>> CreateIsoCategoryAsync(CreateIsoCategoryRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return ApiResponse<int>.Fail("Category name is required.");

        var newId = await _isoCategoryRepository.CreateIsoCategoryAsync(request, cancellationToken);
        return ApiResponse<int>.Ok(newId, "Category created successfully.");
    }
}
