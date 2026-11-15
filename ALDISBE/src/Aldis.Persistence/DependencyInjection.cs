using Aldis.Application.Interfaces.Repositories;
using Aldis.Persistence.Context;
using Aldis.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Aldis.Persistence;

public static class DependencyInjection
{
    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<AldisDbContext>(options =>
            options.UseNpgsql(connectionString)
                   .UseSnakeCaseNamingConvention());

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IDepartmentRepository, DepartmentRepository>();
        services.AddScoped<IIsoCategoryRepository, IsoCategoryRepository>();
        services.AddScoped<IIsoStandardRepository, IsoStandardRepository>();
        services.AddScoped<IAuditRepository, AuditRepository>();

        return services;
    }
}
