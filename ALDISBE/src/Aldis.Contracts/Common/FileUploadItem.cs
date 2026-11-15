namespace Aldis.Contracts.Common;

/// <summary>File upload yang sudah dilepas dari tipe ASP.NET agar layer Application tetap bebas framework web.</summary>
public class FileUploadItem
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Length { get; set; }
    public Stream Content { get; set; } = Stream.Null;
}
