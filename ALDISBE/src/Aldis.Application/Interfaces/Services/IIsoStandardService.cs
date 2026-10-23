using Aldis.Contracts.Common;
using Aldis.Contracts.Standards;

namespace Aldis.Application.Interfaces.Services;

public interface IIsoStandardService
{
    Task<ApiResponse<IEnumerable<IsoStandardResponse>>> GetAllIsoStandardsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<int>> CreateIsoStandardAsync(CreateIsoStandardRequest request, CancellationToken cancellationToken = default);
}
