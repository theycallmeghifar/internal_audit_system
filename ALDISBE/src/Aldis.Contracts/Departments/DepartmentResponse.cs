namespace Aldis.Contracts.Departments;

public class DepartmentResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int? HeadUserId { get; set; }
    public string? HeadUserName { get; set; }
    public string? HeadUserEmail { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
    public string? UpdateBy { get; set; }
    public DateTime? UpdateDate { get; set; }
    public bool IsActive { get; set; }
}
