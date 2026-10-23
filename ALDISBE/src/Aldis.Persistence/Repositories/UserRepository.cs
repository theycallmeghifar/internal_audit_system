using System.Data;
using System.Data.Common;
using Aldis.Application.Interfaces.Repositories;
using Aldis.Contracts.Users;
using Aldis.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Aldis.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AldisDbContext _context;

    public UserRepository(AldisDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<UserResponse>> GetAllUsersAsync(CancellationToken cancellationToken = default)
    {
        var result = new List<UserResponse>();
        var connection = _context.Database.GetDbConnection();

        if (connection.State != ConnectionState.Open)
            await connection.OpenAsync(cancellationToken);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM sp_get_users();";
        command.CommandType = CommandType.Text;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            result.Add(new UserResponse
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                EmployeeId = reader.GetString(reader.GetOrdinal("employee_id")),
                Fullname = reader.GetString(reader.GetOrdinal("fullname")),
                Nickname = reader.IsDBNull(reader.GetOrdinal("nickname")) ? null : reader.GetString(reader.GetOrdinal("nickname")),
                Email = reader.GetString(reader.GetOrdinal("email")),
                DepartmentId = reader.IsDBNull(reader.GetOrdinal("department_id")) ? null : reader.GetInt32(reader.GetOrdinal("department_id")),
                DepartmentName = reader.IsDBNull(reader.GetOrdinal("department_name")) ? null : reader.GetString(reader.GetOrdinal("department_name")),
                JobLevel = reader.IsDBNull(reader.GetOrdinal("job_level")) ? null : reader.GetString(reader.GetOrdinal("job_level")),
                JobTitle = reader.IsDBNull(reader.GetOrdinal("job_title")) ? null : reader.GetString(reader.GetOrdinal("job_title")),
                Role = reader.IsDBNull(reader.GetOrdinal("role")) ? null : reader.GetString(reader.GetOrdinal("role")),
                CreatedBy = reader.GetString(reader.GetOrdinal("created_by")),
                CreatedDate = reader.GetDateTime(reader.GetOrdinal("created_date")),
                UpdateBy = reader.IsDBNull(reader.GetOrdinal("update_by")) ? null : reader.GetString(reader.GetOrdinal("update_by")),
                UpdateDate = reader.IsDBNull(reader.GetOrdinal("update_date")) ? null : reader.GetDateTime(reader.GetOrdinal("update_date")),
                IsActive = reader.GetBoolean(reader.GetOrdinal("is_active"))
            });
        }

        return result;
    }

    public async Task<int> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        var connection = _context.Database.GetDbConnection();

        if (connection.State != ConnectionState.Open)
            await connection.OpenAsync(cancellationToken);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT sp_create_user(@p_employee_id, @p_fullname, @p_nickname, @p_email, @p_department_id, @p_job_level, @p_job_title, @p_role, @p_created_by);";
        command.CommandType = CommandType.Text;

        AddParameter(command, "@p_employee_id", request.EmployeeId);
        AddParameter(command, "@p_fullname", request.Fullname);
        AddParameter(command, "@p_nickname", (object?)request.Nickname ?? DBNull.Value);
        AddParameter(command, "@p_email", request.Email);
        AddParameter(command, "@p_department_id", (object?)request.DepartmentId ?? DBNull.Value);
        AddParameter(command, "@p_job_level", (object?)request.JobLevel ?? DBNull.Value);
        AddParameter(command, "@p_job_title", (object?)request.JobTitle ?? DBNull.Value);
        AddParameter(command, "@p_role", (object?)request.Role ?? DBNull.Value);
        AddParameter(command, "@p_created_by", string.IsNullOrWhiteSpace(request.CreatedBy) ? "system" : request.CreatedBy);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToInt32(result);
    }

    private static void AddParameter(DbCommand command, string name, object value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }
}
