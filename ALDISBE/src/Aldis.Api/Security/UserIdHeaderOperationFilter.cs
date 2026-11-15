using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Aldis.Api.Security;

/// <summary>
/// Menambahkan field parameter input langsung untuk header X-User-Id di setiap endpoint Swagger UI.
/// Dengan ini, user bisa langsung mengisi ID user di form endpoint tanpa harus klik tombol Authorize di atas.
/// </summary>
public class UserIdHeaderOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        operation.Parameters ??= new List<OpenApiParameter>();

        // Kecualikan download attachment jika tidak membutuhkan header
        if (context.ApiDescription.RelativePath?.Contains("attachments/{attachmentId}", StringComparison.OrdinalIgnoreCase) == true)
            return;

        if (!operation.Parameters.Any(p => p.Name.Equals(HeaderCurrentUserService.HeaderName, StringComparison.OrdinalIgnoreCase)))
        {
            operation.Parameters.Add(new OpenApiParameter
            {
                Name = HeaderCurrentUserService.HeaderName,
                In = ParameterLocation.Header,
                Required = false,
                Description = "ID User yang sedang bertindak (contoh: 2 = Administrator, 5 = Auditor, 7 = Auditee)",
                Schema = new OpenApiSchema
                {
                    Type = "integer",
                    Default = new OpenApiInteger(2)
                }
            });
        }
    }
}
