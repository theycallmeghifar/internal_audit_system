using Aldis.Application.Interfaces.Services;
using Aldis.Contracts.Common;

namespace Aldis.Infrastructure.Storage;

/// <summary>Menyimpan file ke disk lokal di bawah <c>rootPath</c>. Path yang disimpan di DB selalu relatif.</summary>
public class LocalFileStorage : IFileStorage
{
    private readonly string _rootPath;

    public LocalFileStorage(string rootPath)
    {
        _rootPath = Path.GetFullPath(rootPath);
        Directory.CreateDirectory(_rootPath);
    }

    public async Task<string> SaveAsync(string folder, FileUploadItem file, string extension, CancellationToken cancellationToken = default)
    {
        // Nama file di disk dibuat sendiri (GUID) agar aman dari path traversal & bentrok nama.
        var safeExtension = new string(extension.Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();
        var relativePath = $"{folder.Trim('/', '\\').Replace('\\', '/')}/{Guid.NewGuid():N}.{safeExtension}";
        var fullPath = ResolveSafePath(relativePath);

        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        await using var target = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None);
        await file.Content.CopyToAsync(target, cancellationToken);

        return relativePath;
    }

    public Task DeleteAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        var fullPath = ResolveSafePath(relativePath);
        if (File.Exists(fullPath))
            File.Delete(fullPath);

        return Task.CompletedTask;
    }

    public Task<Stream?> OpenReadAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        var fullPath = ResolveSafePath(relativePath);
        if (!File.Exists(fullPath))
            return Task.FromResult<Stream?>(null);

        Stream stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult<Stream?>(stream);
    }

    private string ResolveSafePath(string relativePath)
    {
        var fullPath = Path.GetFullPath(Path.Combine(_rootPath, relativePath));
        var rootWithSeparator = _rootPath.EndsWith(Path.DirectorySeparatorChar)
            ? _rootPath
            : _rootPath + Path.DirectorySeparatorChar;

        if (!fullPath.StartsWith(rootWithSeparator, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Invalid storage path.");

        return fullPath;
    }
}
