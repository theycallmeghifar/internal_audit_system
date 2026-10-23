using Aldis.Application.Interfaces.Services;
using Aldis.Contracts.Common;
using Aldis.Contracts.Departments;
using Microsoft.AspNetCore.Mvc;

namespace Aldis.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DepartmentController : ControllerBase
{
    private readonly IDepartmentService _departmentService;

    public DepartmentController(IDepartmentService departmentService)
    {
        _departmentService = departmentService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<DepartmentResponse>>>> GetAll(CancellationToken cancellationToken)
    {
        var result = await _departmentService.GetAllDepartmentsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<int>>> Create([FromBody] CreateDepartmentRequest request, CancellationToken cancellationToken)
    {
        var result = await _departmentService.CreateDepartmentAsync(request, cancellationToken);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}
