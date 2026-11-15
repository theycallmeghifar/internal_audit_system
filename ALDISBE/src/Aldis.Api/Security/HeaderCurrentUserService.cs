using Aldis.Application.Interfaces.Services;

namespace Aldis.Api.Security;

/// <summary>
/// Membaca identitas pemanggil dari header <c>X-User-Id</c>.
/// SEMENTARA: belum ada login/JWT di sistem ini. Header ini tidak diverifikasi (siapa pun bisa mengisinya),
/// jadi hanya cocok untuk development/UAT. Ganti implementasi ini dengan claim JWT saat login tersedia.
/// </summary>
public class HeaderCurrentUserService : ICurrentUserService
{
    public const string HeaderName = "X-User-Id";

    private readonly IHttpContextAccessor _httpContextAccessor;

    public HeaderCurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public int? UserId
    {
        get
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext is null)
                return null;

            // 1. Coba baca dari HTTP Header: X-User-Id
            var value = httpContext.Request.Headers[HeaderName].FirstOrDefault();

            // 2. Fallback: coba baca dari query string ?userId= atau ?x-user-id= (sangat membantu saat test di browser / Swagger)
            if (string.IsNullOrWhiteSpace(value))
            {
                value = httpContext.Request.Query["userId"].FirstOrDefault()
                     ?? httpContext.Request.Query["X-User-Id"].FirstOrDefault()
                     ?? httpContext.Request.Query["x-user-id"].FirstOrDefault();
            }

            return int.TryParse(value, out var id) && id > 0 ? id : null;
        }
    }
}
