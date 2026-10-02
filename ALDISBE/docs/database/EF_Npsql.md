Aldis.Infrastructure
│
├── AldisDbContext
├── EntityConfiguration
└── Migrations
       ↑
       │ target project

Aldis.Api
│
├── Program.cs
├── appsettings.json
├── ConnectionStrings
└── AddDbContext(...)
       ↑
       │ startup project
       │
       └── menyediakan DbContextOptions<AldisDbContext>


## script add migration      
Execute Script from path "C:\Projects\jp-ent-platform\src\Aldis.Infrastructure>"

dotnet ef migrations add AddAuditLogToReferenceRequestDetails `
    --startup-project ../Aldis.Api

## script database update
Execute Script from path "C:\Projects\jp-ent-platform\src\Aldis.Infrastructure>"
dotnet ef database update `
    --startup-project ../Aldis.Api

