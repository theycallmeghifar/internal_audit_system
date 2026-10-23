using System.Data;
using System.Data.Common;
using Aldis.Application.Interfaces.Repositories;
using Aldis.Contracts.Categories;
using Aldis.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Aldis.Persistence.Repositories;

public class IsoCategoryRepository : IIsoCategoryRepository
{
    private readonly AldisDbContext _context;

    public IsoCategoryRepository(AldisDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<IsoCategoryResponse>> GetAllIsoCategoriesAsync(CancellationToken cancellationToken = default)
    {
        var result = new List<IsoCategoryResponse>();
        var connection = _context.Database.GetDbConnection();

        if (connection.State != ConnectionState.Open)
            await connection.OpenAsync(cancellationToken);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM sp_get_iso_categories();";
        command.CommandType = CommandType.Text;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            result.Add(new IsoCategoryResponse
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                Name = reader.GetString(reader.GetOrdinal("name")),
                CreatedBy = reader.GetString(reader.GetOrdinal("created_by")),
                CreatedDate = reader.GetDateTime(reader.GetOrdinal("created_date")),
                UpdateBy = reader.IsDBNull(reader.GetOrdinal("update_by")) ? null : reader.GetString(reader.GetOrdinal("update_by")),
                UpdateDate = reader.IsDBNull(reader.GetOrdinal("update_date")) ? null : reader.GetDateTime(reader.GetOrdinal("update_date")),
                IsActive = reader.GetBoolean(reader.GetOrdinal("is_active"))
            });
        }

        return result;
    }

    public async Task<int> CreateIsoCategoryAsync(CreateIsoCategoryRequest request, CancellationToken cancellationToken = default)
    {
        var connection = _context.Database.GetDbConnection();

        if (connection.State != ConnectionState.Open)
            await connection.OpenAsync(cancellationToken);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT sp_create_iso_category(@p_name, @p_created_by);";
        command.CommandType = CommandType.Text;

        AddParameter(command, "@p_name", request.Name);
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
