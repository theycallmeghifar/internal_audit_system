namespace Aldis.Contracts.Categories;

public class CreateIsoCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? CreatedBy { get; set; }
}
