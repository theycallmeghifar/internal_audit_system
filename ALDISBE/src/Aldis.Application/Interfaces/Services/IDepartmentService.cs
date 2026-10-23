using Aldis.Contracts.Common;
using Aldis.Contracts.Departments;

namespace Aldis.Application.Interfaces.Services;

public interface IDepartmentService
{
    Task<ApiResponse<IEnumerable<DepartmentResponse>>> GetAllDepartmentsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<int>> CreateDepartmentAsync(CreateDepartmentRequest request, CancellationToken cancellationToken = default);
}
