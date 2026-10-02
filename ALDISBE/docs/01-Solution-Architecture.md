Only Backend Aldis

│

├── Aldis.Api
Expose REST API.

Authentication.

Dependency Injection.

Middleware.
│

├── Aldis.Application
Contains business use cases.

Contains validation.

Contains interfaces.

Contains business workflow.
│

├── Aldis.Domain
Pure business domain.

Contains only business entities.

No database dependency.

No framework dependency.
│

├── Aldis.Infrastructure
│

├── Aldis.Persistence
Entity Framework

Repository

Migration

Seeding
│

└── Aldis.Contracts
