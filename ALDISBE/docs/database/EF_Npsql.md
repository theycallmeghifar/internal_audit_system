# Entity Framework Core & PostgreSQL (Npgsql) Migration Guide

## Project Structure

```
src/
├── Aldis.Domain
│   ├── Common/BaseAldisTableEntity.cs
│   └── Entities/
│
├── Aldis.Persistence (Target Project)
│   ├── Context/AldisDbContext.cs
│   ├── Context/AldisDbContextFactory.cs
│   ├── Configurations/
│   ├── DependencyInjection.cs
│   └── Migrations/
│
└── Aldis.Api (Startup Project)
    ├── Program.cs
    ├── appsettings.json
    └── appsettings.Development.json
```

---

## Connection String Configuration

In `src/Aldis.Api/appsettings.json` and `src/Aldis.Api/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=aldis;Username=postgres;Password=12345"
  }
}
```

---

## Automatic Migration on Application Startup

Proyek `Aldis.Api` telah dikonfigurasi untuk menjalankan EF Core Migration secara otomatis setiap kali aplikasi dijalankan (`dotnet run`).

Ekstensi migrasi berada di `Aldis.Persistence`:
- File: `src/Aldis.Persistence/Extensions/MigrationExtensions.cs`
- Dipanggil di `src/Aldis.Api/Program.cs`:
  ```csharp
  var app = builder.Build();

  // Automatically apply database migrations on startup
  await app.Services.ApplyMigrationsAsync();
  ```

Fitur:
1. Memeriksa apakah ada *pending migrations*.
2. Jika ada, migrasi akan dijalankan secara otomatis (`MigrateAsync()`), termasuk membuat database jika belum ada.
3. Mencatat log informasi ke logger (`Information` / `Warning` / `Error`).

---

## Migration Scripts

### 1. From Solution Root (`ALDISBE`):

#### Add Migration
```powershell
dotnet ef migrations add <MigrationName> `
    --project src/Aldis.Persistence `
    --startup-project src/Aldis.Api
```

#### Update Database
```powershell
dotnet ef database update `
    --project src/Aldis.Persistence `
    --startup-project src/Aldis.Api
```

#### Remove Last Migration (Before Applying to DB)
```powershell
dotnet ef migrations remove `
    --project src/Aldis.Persistence `
    --startup-project src/Aldis.Api
```

---

### 2. From Persistence Directory (`ALDISBE/src/Aldis.Persistence`):

#### Add Migration
```powershell
cd src/Aldis.Persistence
dotnet ef migrations add <MigrationName> --startup-project ../Aldis.Api
```

#### Update Database
```powershell
dotnet ef database update --startup-project ../Aldis.Api
```
