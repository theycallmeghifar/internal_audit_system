using Aldis.Domain.Common;

namespace Aldis.Domain.Entities;

public class DepartmentEntity : BaseAldisTableEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int? HeadUserId { get; set; }

    // Navigation properties
    public virtual UserEntity? HeadUser { get; set; }
    public virtual ICollection<UserEntity> Users { get; set; } = new List<UserEntity>();
    public virtual ICollection<AuditHeaderEntity> AuditHeaders { get; set; } = new List<AuditHeaderEntity>();
}
