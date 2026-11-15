using Aldis.Application.Interfaces.Repositories;
using Aldis.Application.Interfaces.Services;
using Aldis.Contracts.Common;
using Aldis.Contracts.Standards;

namespace Aldis.Application.Services;

public class IsoStandardService : IIsoStandardService
{
    private readonly IIsoStandardRepository _isoStandardRepository;

    public IsoStandardService(IIsoStandardRepository isoStandardRepository)
    {
        _isoStandardRepository = isoStandardRepository;
    }

    public async Task<ApiResponse<IEnumerable<IsoStandardResponse>>> GetAllIsoStandardsAsync(CancellationToken cancellationToken = default)
    {
        var standards = await _isoStandardRepository.GetAllIsoStandardsAsync(cancellationToken);
        return ApiResponse<IEnumerable<IsoStandardResponse>>.Ok(standards);
    }

    public async Task<ApiResponse<int>> CreateIsoStandardAsync(CreateIsoStandardRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
            return ApiResponse<int>.Fail("Standard code is required.");

        if (string.IsNullOrWhiteSpace(request.Title))
            return ApiResponse<int>.Fail("Standard title is required.");

        if (request.CategoryId <= 0)
            request.CategoryId = null;

        var newId = await _isoStandardRepository.CreateIsoStandardAsync(request, cancellationToken);
        return ApiResponse<int>.Ok(newId, "Standard created successfully.");
    }
}
