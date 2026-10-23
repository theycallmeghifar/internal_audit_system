using Aldis.Application.Interfaces.Services;
using Aldis.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Aldis.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IDepartmentService, DepartmentService>();
        services.AddScoped<IIsoCategoryService, IsoCategoryService>();
        services.AddScoped<IIsoStandardService, IsoStandardService>();

        return services;
    }
}
