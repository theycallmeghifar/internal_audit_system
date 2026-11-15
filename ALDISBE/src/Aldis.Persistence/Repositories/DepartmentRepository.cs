using System.Data;
using System.Data.Common;
using Aldis.Application.Interfaces.Repositories;
using Aldis.Contracts.Departments;
using Aldis.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Aldis.Persistence.Repositories;

public class DepartmentRepository : IDepartmentRepository
{
    private readonly AldisDbContext _context;

    public DepartmentRepository(AldisDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<DepartmentResponse>> GetAllDepartmentsAsync(CancellationToken cancellationToken = default)
    {
        var result = new List<DepartmentResponse>();
        var connection = _context.Database.GetDbConnection();

        if (connection.State != ConnectionState.Open)
            await connection.OpenAsync(cancellationToken);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM sp_get_departments();";
        command.CommandType = CommandType.Text;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            result.Add(new DepartmentResponse
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                Code = reader.GetString(reader.GetOrdinal("code")),
                Name = reader.GetString(reader.GetOrdinal("name")),
                HeadUserId = reader.IsDBNull(reader.GetOrdinal("head_user_id")) ? null : reader.GetInt32(reader.GetOrdinal("head_user_id")),
                HeadUserName = reader.IsDBNull(reader.GetOrdinal("head_user_name")) ? null : reader.GetString(reader.GetOrdinal("head_user_name")),
                HeadUserEmail = reader.IsDBNull(reader.GetOrdinal("head_user_email")) ? null : reader.GetString(reader.GetOrdinal("head_user_email")),
                CreatedBy = reader.GetString(reader.GetOrdinal("created_by")),
                CreatedDate = reader.GetDateTime(reader.GetOrdinal("created_date")),
                UpdateBy = reader.IsDBNull(reader.GetOrdinal("update_by")) ? null : reader.GetString(reader.GetOrdinal("update_by")),
                UpdateDate = reader.IsDBNull(reader.GetOrdinal("update_date")) ? null : reader.GetDateTime(reader.GetOrdinal("update_date")),
                IsActive = reader.GetBoolean(reader.GetOrdinal("is_active"))
            });
        }

        return result;
    }

    public async Task<int> CreateDepartmentAsync(CreateDepartmentRequest request, CancellationToken cancellationToken = default)
    {
        var connection = _context.Database.GetDbConnection();

        if (connection.State != ConnectionState.Open)
            await connection.OpenAsync(cancellationToken);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT sp_create_department(@p_code, @p_name, @p_head_user_id, @p_created_by);";
        command.CommandType = CommandType.Text;

        AddParameter(command, "@p_code", request.Code);
        AddParameter(command, "@p_name", request.Name);
        AddParameter(command, "@p_head_user_id", request.HeadUserId > 0 ? request.HeadUserId.Value : DBNull.Value);
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
