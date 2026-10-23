using Aldis.Application.Interfaces.Repositories;
using Aldis.Application.Interfaces.Services;
using Aldis.Contracts.Common;
using Aldis.Contracts.Users;

namespace Aldis.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<ApiResponse<IEnumerable<UserResponse>>> GetAllUsersAsync(CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetAllUsersAsync(cancellationToken);
        return ApiResponse<IEnumerable<UserResponse>>.Ok(users);
    }

    public async Task<ApiResponse<int>> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.EmployeeId))
            return ApiResponse<int>.Fail("Employee ID is required.");

        if (string.IsNullOrWhiteSpace(request.Fullname))
            return ApiResponse<int>.Fail("Fullname is required.");

        if (string.IsNullOrWhiteSpace(request.Email))
            return ApiResponse<int>.Fail("Email is required.");

        var newId = await _userRepository.CreateUserAsync(request, cancellationToken);
        return ApiResponse<int>.Ok(newId, "User created successfully.");
    }
}
