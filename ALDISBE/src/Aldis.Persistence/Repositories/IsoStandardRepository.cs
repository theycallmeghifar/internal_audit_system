using System.Data;
using System.Data.Common;
using Aldis.Application.Interfaces.Repositories;
using Aldis.Contracts.Standards;
using Aldis.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Aldis.Persistence.Repositories;

public class IsoStandardRepository : IIsoStandardRepository
{
    private readonly AldisDbContext _context;

    public IsoStandardRepository(AldisDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<IsoStandardResponse>> GetAllIsoStandardsAsync(CancellationToken cancellationToken = default)
    {
        var result = new List<IsoStandardResponse>();
        var connection = _context.Database.GetDbConnection();

        if (connection.State != ConnectionState.Open)
            await connection.OpenAsync(cancellationToken);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM sp_get_iso_standards();";
        command.CommandType = CommandType.Text;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            result.Add(new IsoStandardResponse
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                Code = reader.GetString(reader.GetOrdinal("code")),
                Version = reader.IsDBNull(reader.GetOrdinal("version")) ? null : reader.GetString(reader.GetOrdinal("version")),
                Title = reader.GetString(reader.GetOrdinal("title")),
                CategoryId = reader.IsDBNull(reader.GetOrdinal("category_id")) ? null : reader.GetInt32(reader.GetOrdinal("category_id")),
                CategoryName = reader.IsDBNull(reader.GetOrdinal("category_name")) ? null : reader.GetString(reader.GetOrdinal("category_name")),
                EffectiveDate = reader.IsDBNull(reader.GetOrdinal("effective_date")) ? null : DateOnly.FromDateTime(reader.GetDateTime(reader.GetOrdinal("effective_date"))),
                CreatedBy = reader.GetString(reader.GetOrdinal("created_by")),
                CreatedDate = reader.GetDateTime(reader.GetOrdinal("created_date")),
                UpdateBy = reader.IsDBNull(reader.GetOrdinal("update_by")) ? null : reader.GetString(reader.GetOrdinal("update_by")),
                UpdateDate = reader.IsDBNull(reader.GetOrdinal("update_date")) ? null : reader.GetDateTime(reader.GetOrdinal("update_date")),
                IsActive = reader.GetBoolean(reader.GetOrdinal("is_active"))
            });
        }

        return result;
    }

    public async Task<int> CreateIsoStandardAsync(CreateIsoStandardRequest request, CancellationToken cancellationToken = default)
    {
        var connection = _context.Database.GetDbConnection();

        if (connection.State != ConnectionState.Open)
            await connection.OpenAsync(cancellationToken);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT sp_create_iso_standard(@p_code, @p_version, @p_title, @p_category_id, @p_effective_date, @p_created_by);";
        command.CommandType = CommandType.Text;

        AddParameter(command, "@p_code", request.Code);
        AddParameter(command, "@p_version", (object?)request.Version ?? DBNull.Value);
        AddParameter(command, "@p_title", request.Title);
        AddParameter(command, "@p_category_id", (object?)request.CategoryId ?? DBNull.Value);
        AddParameter(command, "@p_effective_date", request.EffectiveDate.HasValue ? request.EffectiveDate.Value.ToDateTime(TimeOnly.MinValue) : DBNull.Value);
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
