namespace Aldis.Contracts.Users;

public class CreateUserRequest
{
    public string EmployeeId { get; set; } = string.Empty;
    public string Fullname { get; set; } = string.Empty;
    public string? Nickname { get; set; }
    public string Email { get; set; } = string.Empty;
    public int? DepartmentId { get; set; }
    public string? JobLevel { get; set; }
    public string? JobTitle { get; set; }
    public string? Role { get; set; }
    public string? CreatedBy { get; set; }
}
