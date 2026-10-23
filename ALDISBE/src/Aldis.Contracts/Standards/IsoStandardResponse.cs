namespace Aldis.Contracts.Standards;

public class IsoStandardResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Version { get; set; }
    public string Title { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public DateOnly? EffectiveDate { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
    public string? UpdateBy { get; set; }
    public DateTime? UpdateDate { get; set; }
    public bool IsActive { get; set; }
}
