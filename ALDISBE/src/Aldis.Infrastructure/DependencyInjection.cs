using Aldis.Application.Interfaces.Services;
using Aldis.Infrastructure.Storage;
using Microsoft.Extensions.DependencyInjection;

namespace Aldis.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string storageRootPath)
    {
        services.AddSingleton<IFileStorage>(_ => new LocalFileStorage(storageRootPath));

        return services;
    }
}
