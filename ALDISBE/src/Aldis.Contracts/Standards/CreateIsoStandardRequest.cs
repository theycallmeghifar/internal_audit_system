namespace Aldis.Contracts.Standards;

public class CreateIsoStandardRequest
{
    public string Code { get; set; } = string.Empty;
    public string? Version { get; set; }
    public string Title { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public DateOnly? EffectiveDate { get; set; }
    public string? CreatedBy { get; set; }
}
