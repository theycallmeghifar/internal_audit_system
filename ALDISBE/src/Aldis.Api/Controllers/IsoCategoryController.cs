using Aldis.Application.Interfaces.Services;
using Aldis.Contracts.Categories;
using Aldis.Contracts.Common;
using Microsoft.AspNetCore.Mvc;

namespace Aldis.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IsoCategoryController : ControllerBase
{
    private readonly IIsoCategoryService _isoCategoryService;

    public IsoCategoryController(IIsoCategoryService isoCategoryService)
    {
        _isoCategoryService = isoCategoryService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<IsoCategoryResponse>>>> GetAll(CancellationToken cancellationToken)
    {
        var result = await _isoCategoryService.GetAllIsoCategoriesAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<int>>> Create([FromBody] CreateIsoCategoryRequest request, CancellationToken cancellationToken)
    {
        var result = await _isoCategoryService.CreateIsoCategoryAsync(request, cancellationToken);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}
