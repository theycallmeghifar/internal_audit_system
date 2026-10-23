using Aldis.Contracts.Categories;

namespace Aldis.Application.Interfaces.Repositories;

public interface IIsoCategoryRepository
{
    Task<IEnumerable<IsoCategoryResponse>> GetAllIsoCategoriesAsync(CancellationToken cancellationToken = default);
    Task<int> CreateIsoCategoryAsync(CreateIsoCategoryRequest request, CancellationToken cancellationToken = default);
}
