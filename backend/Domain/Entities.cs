using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace HenManager.Api.Domain;

// DTOs compartidos
public record RoleSummary(Guid Id, string Name);
public record UserSummary(Guid Id, string UserName, bool IsActive, List<RoleSummary> Roles);
public record UpsertUserRequest(string UserName, string? Password, bool IsActive, List<Guid> RoleIds);

public abstract class MongoEntity
{
    [BsonId]
    [BsonGuidRepresentation(GuidRepresentation.Standard)]
    public Guid Id { get; set; }
}

public class User : MongoEntity
{
    public string UserName { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public bool IsActive { get; set; } = true;
    public List<Guid> RoleIds { get; set; } = new();
}

public class Role : MongoEntity
{
    public string Name { get; set; } = default!;
    public List<Guid> PermissionIds { get; set; } = new();
    // compatibilidad con roles antiguos que guardaban códigos
    [BsonElement("permissions")]
    public List<string>? LegacyPermissionCodes { get; set; }
}

public class PermissionEntity : MongoEntity
{
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
}

public class HenBatch : MongoEntity
{
    public string Name { get; set; } = default!;
    public DateTime StartDate { get; set; } = DateTime.UtcNow.Date;
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; } = true;

    public int HensCount { get; set; }
    public string? Notes { get; set; }
}

// Enum legacy para compatibilidad con datos existentes
public enum EggType
{
    Pequeno,
    Mediano,
    Grande,
    ExtraGrande,
    DobleYema,
    Roto
}

// Entidad para tipos de huevo dinámicos
public class EggTypeEntity : MongoEntity
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;
}

public class EggProduction : MongoEntity
{
    [BsonGuidRepresentation(GuidRepresentation.Standard)]
    public Guid HenBatchId { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow.Date;
    public EggType EggType { get; set; }
    public int Quantity { get; set; }
    [BsonGuidRepresentation(GuidRepresentation.Standard)]
    public Guid RegisteredById { get; set; }
}

public enum PaymentType
{
    Contado,
    Credito
}

public enum CreditStatus
{
    Pendiente,
    Cancelado
}

public class Sale : MongoEntity
{
    [BsonGuidRepresentation(GuidRepresentation.Standard)]
    public Guid HenBatchId { get; set; }
    [BsonGuidRepresentation(GuidRepresentation.Standard)]
    public Guid CustomerId { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow.Date;

    public EggType? EggType { get; set; }

    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public PaymentType PaymentType { get; set; }

    public CreditStatus CreditStatus { get; set; } = CreditStatus.Cancelado;
    public decimal AmountPaid { get; set; }
    public decimal PendingAmount { get; set; }
    public DateTime? PaidAt { get; set; }

    [BsonGuidRepresentation(GuidRepresentation.Standard)]
    public Guid SoldById { get; set; }

    [BsonIgnore]
    public decimal Total => Quantity * UnitPrice;
}

public class Payment : MongoEntity
{
    [BsonGuidRepresentation(GuidRepresentation.Standard)]
    public Guid SaleId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
    [BsonGuidRepresentation(GuidRepresentation.Standard)]
    public Guid PaidById { get; set; }
}

public class Supply : MongoEntity
{
    [BsonGuidRepresentation(GuidRepresentation.Standard)]
    public Guid HenBatchId { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow.Date;
    public string Name { get; set; } = default!;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = default!;
    public decimal? Cost { get; set; }
    [BsonGuidRepresentation(GuidRepresentation.Standard)]
    public Guid RegisteredById { get; set; }
}

public class Customer : MongoEntity
{
    public string Name { get; set; } = default!;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public bool IsActive { get; set; } = true;
}