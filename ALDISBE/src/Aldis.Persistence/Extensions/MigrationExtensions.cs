using Aldis.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Aldis.Persistence;

public static class MigrationExtensions
{
    /// <summary>
    /// Automatically applies any pending database migrations on application startup.
    /// Creates the database if it does not already exist.
    /// </summary>
    public static async Task ApplyMigrationsAsync(this IServiceProvider serviceProvider, CancellationToken cancellationToken = default)
    {
        using var scope = serviceProvider.CreateScope();
        var services = scope.ServiceProvider;
        var logger = services.GetService<ILogger<AldisDbContext>>();
        var context = services.GetRequiredService<AldisDbContext>();

        try
        {
            logger?.LogInformation("Checking for pending database migrations...");

            var pendingMigrations = (await context.Database.GetPendingMigrationsAsync(cancellationToken)).ToList();
            if (pendingMigrations.Count > 0)
            {
                logger?.LogInformation("Applying {Count} pending migration(s): {Migrations}...",
                    pendingMigrations.Count, string.Join(", ", pendingMigrations));

                await context.Database.MigrateAsync(cancellationToken);

                logger?.LogInformation("Database migrations applied successfully.");
            }
            else
            {
                logger?.LogInformation("Database is up to date. No pending migrations.");
            }
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "Initial migration check failed. Attempting direct migration...");
            try
            {
                await context.Database.MigrateAsync(cancellationToken);
                logger?.LogInformation("Database migrations applied successfully.");
            }
            catch (Exception migrateEx)
            {
                logger?.LogError(migrateEx, "An error occurred while applying database migrations. Please verify PostgreSQL connection and credentials.");
                throw;
            }
        }
    }

    /// <summary>
    /// Automatically applies any pending database migrations synchronously on application startup.
    /// Creates the database if it does not already exist.
    /// </summary>
    public static void ApplyMigrations(this IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var services = scope.ServiceProvider;
        var logger = services.GetService<ILogger<AldisDbContext>>();
        var context = services.GetRequiredService<AldisDbContext>();

        try
        {
            logger?.LogInformation("Checking for pending database migrations...");

            var pendingMigrations = context.Database.GetPendingMigrations().ToList();
            if (pendingMigrations.Count > 0)
            {
                logger?.LogInformation("Applying {Count} pending migration(s): {Migrations}...",
                    pendingMigrations.Count, string.Join(", ", pendingMigrations));

                context.Database.Migrate();

                logger?.LogInformation("Database migrations applied successfully.");
            }
            else
            {
                logger?.LogInformation("Database is up to date. No pending migrations.");
            }
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "Initial migration check failed. Attempting direct migration...");
            try
            {
                context.Database.Migrate();
                logger?.LogInformation("Database migrations applied successfully.");
            }
            catch (Exception migrateEx)
            {
                logger?.LogError(migrateEx, "An error occurred while applying database migrations. Please verify PostgreSQL connection and credentials.");
                throw;
            }
        }
    }
}
