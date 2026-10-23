# EnterpriseUI Development Standards

Version : 1.0

---

# Objective

This document defines the development standards for the EnterpriseUI project.

Every developer must follow this standard.

---

# Technology Stack

Backend

- ASP.NET Core Web API (.NET 9)

Database

- PostgreSQL

ORM

- Entity Framework Core

IDE

- Visual Studio Code
- Visual Studio 2022 (Optional)

---

# Architecture

Backend

Clean Architecture

- Aldis.Api
- Aldis.Application
- Aldis.Domain
- Aldis.Infrastructure
- Aldis.Persistence
- Aldis.Contracts

---

# General Rules

Business Logic must NOT exist in UI.

Business Logic must NOT exist in Controller.

Business Logic belongs to Application Layer.

---

# Coding Principles

Single Responsibility Principle

Open Closed Principle

Dependency Injection

Interface Based Programming

Async Programming

Repository Pattern

Unit of Work (Future)

CQRS (Future if required)

---

# Naming Convention

Penamaan komponen di setiap layer mengikuti nama entitas (prefix entitas) dan diberi suffix sesuai konteks layer:

- **Entity**: `<EntityName>Entity`
  - Contoh: `AuditAuditeeEntity`, `UserEntity`, `DepartmentEntity`
- **Repository Interface**: `I<EntityName>Repository`
  - Contoh: `IAuditAuditeeRepository`, `IUserRepository`, `IDepartmentRepository`
- **Repository Implementation**: `<EntityName>Repository`
  - Contoh: `AuditAuditeeRepository`, `UserRepository`, `DepartmentRepository`
- **Service Interface**: `I<EntityName>Service`
  - Contoh: `IAuditAuditeeService`, `IUserService`, `IDepartmentService`
- **Service Implementation**: `<EntityName>Service`
  - Contoh: `AuditAuditeeService`, `UserService`, `DepartmentService`
- **Controller**: `<EntityName>Controller`
  - Contoh: `AuditAuditeeController`, `UserController`, `DepartmentController`
- **DTO Request**: `Create<EntityName>Request` / `Update<EntityName>Request`
  - Contoh: `CreateUserRequest`, `CreateDepartmentRequest`
- **DTO Response**: `<EntityName>Response`
  - Contoh: `UserResponse`, `DepartmentResponse`

---

# Stored Procedure & Transaction Rules

1. **Pembuatan Stored Procedure**:
   - Seluruh Stored Procedure (SP) / Function wajib dibuat dan didokumentasikan melalui **EF Core Migration** di project `Aldis.Persistence` (`migrationBuilder.Sql(...)`).
   - Sediakan skrip `DROP` pada method `Down()` untuk mendukung rollback migrasi.

2. **Logika Transaksi (Transaction, Commit, & Rollback)**:
   - Setiap SP mutasi data (Create/Update/Delete) di PostgreSQL PL/pgSQL wajib menggunakan blok penanganan transaksi / subtransaksi:
     ```sql
     CREATE OR REPLACE FUNCTION sp_create_<entity>(
         p_param1 VARCHAR,
         ...
     )
     RETURNS INT
     LANGUAGE plpgsql
     AS $$
     DECLARE
         v_new_id INT;
     BEGIN
         -- 1. Blok Transaksi: Operasi mutasi data
         INSERT INTO <table> (...)
         VALUES (...)
         RETURNING id INTO v_new_id;

         -- 2. Mengembalikan nilai sukses
         RETURN v_new_id;
     EXCEPTION
         WHEN OTHERS THEN
             -- 3. Rollback otomatis pada blok subtransaksi dan lempar exception
             RAISE EXCEPTION 'Transaction failed in sp_create_<entity>: %', SQLERRM;
     END;
     $$;
     ```
   - Untuk pembacaan data tabel (*read/list*), gunakan pola:
     ```sql
     CREATE OR REPLACE FUNCTION sp_get_<entities>()
     RETURNS TABLE (...)
     LANGUAGE plpgsql
     AS $$
     BEGIN
         RETURN QUERY
         SELECT ... FROM <table> WHERE is_active = true ORDER BY id DESC;
     END;
     $$;
     ```

3. **Layering Rule untuk Stored Procedure**:
   - Eksekusi SP hanya boleh dilakukan di **Repository Layer** (`Aldis.Persistence`).
   - Service Layer (`Aldis.Application`) mengelola validasi dan logika bisnis sebelum/sesudah memanggil repository.
   - Controller (`Aldis.Api`) hanya menerima HTTP Request dan mengembalikan `ApiResponse<T>`.

---

# Folder Rule

One Responsibility Per Folder

No Random Folder

No Utils Folder inside Feature

---

# API Rule

Controller maximum 50 lines (guideline)

No SQL inside Controller

No EF Core inside Controller

Use Service Layer

---

# Database Rule

Migration only in Persistence

No SQL Script inside API

---

# Git Rule

One feature one branch

Pull Request Required

Code Review Required

---

# Documentation Rule

Every Sprint must update documentation.

Every Architecture Change requires ADR.
