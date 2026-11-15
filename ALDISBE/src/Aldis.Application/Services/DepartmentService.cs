using Aldis.Application.Interfaces.Repositories;
using Aldis.Application.Interfaces.Services;
using Aldis.Contracts.Common;
using Aldis.Contracts.Departments;

namespace Aldis.Application.Services;

public class DepartmentService : IDepartmentService
{
    private readonly IDepartmentRepository _departmentRepository;

    public DepartmentService(IDepartmentRepository departmentRepository)
    {
        _departmentRepository = departmentRepository;
    }

    public async Task<ApiResponse<IEnumerable<DepartmentResponse>>> GetAllDepartmentsAsync(CancellationToken cancellationToken = default)
    {
        var departments = await _departmentRepository.GetAllDepartmentsAsync(cancellationToken);
        return ApiResponse<IEnumerable<DepartmentResponse>>.Ok(departments);
    }

    public async Task<ApiResponse<int>> CreateDepartmentAsync(CreateDepartmentRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
            return ApiResponse<int>.Fail("Department code is required.");

        if (string.IsNullOrWhiteSpace(request.Name))
            return ApiResponse<int>.Fail("Department name is required.");

        if (request.HeadUserId <= 0)
            request.HeadUserId = null;

        var newId = await _departmentRepository.CreateDepartmentAsync(request, cancellationToken);
        return ApiResponse<int>.Ok(newId, "Department created successfully.");
    }
}
