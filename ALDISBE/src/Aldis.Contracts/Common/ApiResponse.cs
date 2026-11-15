namespace Aldis.Contracts.Common;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }

    /// <summary>Kode error mesin-baca (lihat <see cref="ApiErrorCodes"/>). Null jika sukses.</summary>
    public string? ErrorCode { get; set; }

    /// <summary>Daftar detail error (mis. checksheet mana yang belum lengkap). Null jika tidak ada.</summary>
    public List<string>? Errors { get; set; }

    public static ApiResponse<T> Ok(T data, string message = "Success") =>
        new() { Success = true, Message = message, Data = data };

    public static ApiResponse<T> Fail(string message, string? errorCode = null, List<string>? errors = null) =>
        new() { Success = false, Message = message, Data = default, ErrorCode = errorCode, Errors = errors };
}

public static class ApiErrorCodes
{
    public const string Validation = "VALIDATION";
    public const string Unauthorized = "UNAUTHORIZED";
    public const string Forbidden = "FORBIDDEN";
    public const string NotFound = "NOT_FOUND";
    public const string Conflict = "CONFLICT";
}
