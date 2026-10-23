using Aldis.Domain.Common;

namespace Aldis.Domain.Entities;

public class IsoCategoryEntity : BaseAldisTableEntity
{
    public string Name { get; set; } = string.Empty;

    // Navigation properties
    public virtual ICollection<IsoStandardEntity> IsoStandards { get; set; } = new List<IsoStandardEntity>();
}
