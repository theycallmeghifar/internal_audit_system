using Aldis.Application.Interfaces.Services;
using Aldis.Contracts.Common;
using Aldis.Contracts.Standards;
using Microsoft.AspNetCore.Mvc;

namespace Aldis.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IsoStandardController : ControllerBase
{
    private readonly IIsoStandardService _isoStandardService;

    public IsoStandardController(IIsoStandardService isoStandardService)
    {
        _isoStandardService = isoStandardService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<IsoStandardResponse>>>> GetAll(CancellationToken cancellationToken)
    {
        var result = await _isoStandardService.GetAllIsoStandardsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<int>>> Create([FromBody] CreateIsoStandardRequest request, CancellationToken cancellationToken)
    {
        var result = await _isoStandardService.CreateIsoStandardAsync(request, cancellationToken);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}
