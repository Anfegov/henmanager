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
    [BsonRepresentation(BsonType.String)]
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
    // permisos referenciados por UUID (PermissionEntity.Id)
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

public enum EggType
{
    Pequeno,
    Mediano,
    Grande,
    ExtraGrande,
    DobleYema,
    Roto
}

public class EggProduction : MongoEntity
{
    public Guid HenBatchId { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow.Date;
    public EggType EggType { get; set; }
    public int Quantity { get; set; }
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
    public Guid HenBatchId { get; set; }
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

    public Guid SoldById { get; set; }

    [BsonIgnore]
    public decimal Total => Quantity * UnitPrice;
}

public class Payment : MongoEntity
{
    public Guid SaleId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
    public Guid PaidById { get; set; }
}

public class Supply : MongoEntity
{
    public Guid HenBatchId { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow.Date;
    public string Name { get; set; } = default!;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = default!;
    public decimal? Cost { get; set; }
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