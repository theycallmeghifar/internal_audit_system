namespace Aldis.Application.Interfaces.Services;

/// <summary>
/// User yang sedang memanggil API. Saat ini diambil dari header <c>X-User-Id</c>
/// (belum ada login/JWT); cukup ganti implementasinya saat autentikasi sungguhan tersedia.
/// </summary>
public interface ICurrentUserService
{
    int? UserId { get; }
}
