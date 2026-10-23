using Aldis.Contracts.Standards;

namespace Aldis.Application.Interfaces.Repositories;

public interface IIsoStandardRepository
{
    Task<IEnumerable<IsoStandardResponse>> GetAllIsoStandardsAsync(CancellationToken cancellationToken = default);
    Task<int> CreateIsoStandardAsync(CreateIsoStandardRequest request, CancellationToken cancellationToken = default);
}
