using Aldis.Contracts.Categories;
using Aldis.Contracts.Common;

namespace Aldis.Application.Interfaces.Services;

public interface IIsoCategoryService
{
    Task<ApiResponse<IEnumerable<IsoCategoryResponse>>> GetAllIsoCategoriesAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<int>> CreateIsoCategoryAsync(CreateIsoCategoryRequest request, CancellationToken cancellationToken = default);
}
