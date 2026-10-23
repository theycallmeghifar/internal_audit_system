using Aldis.Domain.Common;

namespace Aldis.Domain.Entities;

public class UserEntity : BaseAldisTableEntity
{
    public string EmployeeId { get; set; } = string.Empty;
    public string Fullname { get; set; } = string.Empty;
    public string? Nickname { get; set; }
    public string Email { get; set; } = string.Empty;
    public int? DepartmentId { get; set; }
    public string? JobLevel { get; set; }
    public string? JobTitle { get; set; }
    public string? Role { get; set; }

    // Navigation properties
    public virtual DepartmentEntity? Department { get; set; }
    public virtual ICollection<DepartmentEntity> HeadOfDepartments { get; set; } = new List<DepartmentEntity>();
    public virtual ICollection<AuditAuditorEntity> AuditAuditors { get; set; } = new List<AuditAuditorEntity>();
    public virtual ICollection<AuditAuditeeEntity> AuditAuditees { get; set; } = new List<AuditAuditeeEntity>();
    public virtual ICollection<AuditDetailEntity> AssignedAuditDetails { get; set; } = new List<AuditDetailEntity>();
    public virtual ICollection<ActivityLogEntity> ActivityLogs { get; set; } = new List<ActivityLogEntity>();
}
