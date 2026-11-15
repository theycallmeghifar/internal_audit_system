using Aldis.Contracts.Common;

namespace Aldis.Application.Interfaces.Services;

/// <summary>Penyimpanan file bukti improvement. Implementasi ada di Aldis.Infrastructure.</summary>
public interface IFileStorage
{
    /// <summary>Menyimpan file dan mengembalikan path relatif (dipakai sebagai <c>file_path</c>).</summary>
    Task<string> SaveAsync(string folder, FileUploadItem file, string extension, CancellationToken cancellationToken = default);

    Task DeleteAsync(string relativePath, CancellationToken cancellationToken = default);

    /// <summary>Membuka file untuk dibaca, atau null bila tidak ditemukan.</summary>
    Task<Stream?> OpenReadAsync(string relativePath, CancellationToken cancellationToken = default);
}
