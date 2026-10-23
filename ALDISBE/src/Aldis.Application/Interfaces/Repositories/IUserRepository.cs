using Aldis.Contracts.Users;

namespace Aldis.Application.Interfaces.Repositories;

public interface IUserRepository
{
    Task<IEnumerable<UserResponse>> GetAllUsersAsync(CancellationToken cancellationToken = default);
    Task<int> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default);
}
