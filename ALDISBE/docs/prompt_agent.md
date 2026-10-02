Read and understand these project standards before making any changes:

- AI_AGENT_CONTEXT.md
- docs/02-Development-Standards.md

These documents are the source of truth for backend architecture,
folder structure, and development workflow.

Do not change the architecture defined in these documents.

Do not create unnecessary projects.

Do not introduce Dynamic Form Builder architecture.

After implementation:

1. Run dotnet clean.
2. Run dotnet build.
3. Fix all compilation errors.
4. Report all CREATE/MODIFY/DELETE files.
5. Report the build result.

Important:
Do not claim success without actually running dotnet build.