namespace Aldis.Contracts.Departments;

public class CreateDepartmentRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int? HeadUserId { get; set; }
    public string? CreatedBy { get; set; }
}
