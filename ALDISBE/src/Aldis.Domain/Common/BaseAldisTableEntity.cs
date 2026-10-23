namespace Aldis.Domain.Common;

public abstract class BaseAldisTableEntity
{
    public int Id { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public string? UpdateBy { get; set; }
    public DateTime? UpdateDate { get; set; }
    public bool IsActive { get; set; } = true;
}
