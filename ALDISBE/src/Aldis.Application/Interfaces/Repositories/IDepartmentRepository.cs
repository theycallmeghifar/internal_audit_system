using Aldis.Contracts.Departments;

namespace Aldis.Application.Interfaces.Repositories;

public interface IDepartmentRepository
{
    Task<IEnumerable<DepartmentResponse>> GetAllDepartmentsAsync(CancellationToken cancellationToken = default);
    Task<int> CreateDepartmentAsync(CreateDepartmentRequest request, CancellationToken cancellationToken = default);
}
