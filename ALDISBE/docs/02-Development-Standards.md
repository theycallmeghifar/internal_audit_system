# EnterpriseUI Development Standards

Version : 1.0

---

# Objective

This document defines the development standards for the EnterpriseUI project.

Every developer must follow this standard.

---

# Technology Stack

Backend

- ASP.NET Core Web API (.NET 8)

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

EnterpriseUI.Api

EnterpriseUI.Application

EnterpriseUI.Domain

EnterpriseUI.Infrastructure

EnterpriseUI.Persistence

EnterpriseUI.Contracts

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

Service

SubmissionService

Repository

SubmissionRepository

Interface

ISubmissionService

DTO

SubmissionDto

Request

CreateSubmissionRequest

Response

SubmissionResponse

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
