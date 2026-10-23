using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Aldis.Persistence.Context;

public class AldisDbContextFactory : IDesignTimeDbContextFactory<AldisDbContext>
{
    public AldisDbContext CreateDbContext(string[] args)
    {
        var basePath = Path.Combine(Directory.GetCurrentDirectory(), "../Aldis.Api");
        if (!Directory.Exists(basePath))
        {
            basePath = Directory.GetCurrentDirectory();
        }

        var configuration = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=aldis;Username=postgres;Password=12345";

        var builder = new DbContextOptionsBuilder<AldisDbContext>();
        builder.UseNpgsql(connectionString)
               .UseSnakeCaseNamingConvention();

        return new AldisDbContext(builder.Options);
    }
}
