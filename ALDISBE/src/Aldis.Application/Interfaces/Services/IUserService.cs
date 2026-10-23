using Aldis.Contracts.Common;
using Aldis.Contracts.Users;

namespace Aldis.Application.Interfaces.Services;

public interface IUserService
{
    Task<ApiResponse<IEnumerable<UserResponse>>> GetAllUsersAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<int>> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default);
}
