using HenManager.Api.Data;
using HenManager.Api.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace HenManager.Api.Controllers;

public record RegisterSaleRequest(
    Guid HenBatchId,
    Guid CustomerId,
    DateTime Date,
    EggType EggType,
    int Quantity,
    decimal UnitPrice,
    PaymentType PaymentType);

[ApiController]
[Route("api/sales")]
[Authorize(Policy = "ViewSales")]
public class SaleController : ControllerBase
{
    private readonly MongoDbContext _db;
    public SaleController(MongoDbContext db) => _db = db;

    public class SaleDto
    {
        public Guid Id { get; set; }
        public Guid HenBatchId { get; set; }
        public Guid CustomerId { get; set; }
        public DateTime Date { get; set; }
        public string? EggType { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Total { get; set; }
        public string PaymentType { get; set; } = "";
        public string CreditStatus { get; set; } = "";
        public decimal AmountPaid { get; set; }
        public decimal PendingAmount { get; set; }
        public Guid SoldById { get; set; }
        public string SoldByName { get; set; } = "";
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SaleDto>>> GetAll()
    {
        var list = await _db.Sales.Find(_ => true)
            .SortByDescending(s => s.Date)
            .ToListAsync();

        var userIds = list.Select(s => s.SoldById).Distinct().ToList();
        var users = await _db.Users.Find(u => userIds.Contains(u.Id)).ToListAsync();
        var userMap = users.ToDictionary(u => u.Id, u => u.UserName);

        var result = list.Select(s => new SaleDto
        {
            Id = s.Id,
            HenBatchId = s.HenBatchId,
            CustomerId = s.CustomerId,
            Date = s.Date,
            EggType = s.EggType?.ToString(),
            Quantity = s.Quantity,
            UnitPrice = s.UnitPrice,
            Total = s.Total,
            PaymentType = s.PaymentType.ToString(),
            CreditStatus = s.CreditStatus.ToString(),
            AmountPaid = s.AmountPaid,
            PendingAmount = s.PendingAmount,
            SoldById = s.SoldById,
            SoldByName = userMap.TryGetValue(s.SoldById, out var name) ? name : "Usuario"
        }).ToList();

        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "CreateSale")]
    public async Task<ActionResult<Sale>> RegisterSale(RegisterSaleRequest request)
    {
        var batch = await _db.HenBatches.Find(b => b.Id == request.HenBatchId).FirstOrDefaultAsync();
        if (batch is null) return BadRequest("Camada no existe.");
        if (!batch.IsActive) return BadRequest("Camada cerrada.");

        var customer = await _db.Customers.Find(c => c.Id == request.CustomerId).FirstOrDefaultAsync();
        if (customer is null) return BadRequest("Cliente no existe.");
        if (!customer.IsActive) return BadRequest("Cliente inactivo.");

        var productions = await _db.EggProductions
            .Find(ep => ep.HenBatchId == request.HenBatchId && ep.EggType == request.EggType)
            .ToListAsync();
        var totalProduced = productions.Sum(x => x.Quantity);

        var sales = await _db.Sales
            .Find(s => s.HenBatchId == request.HenBatchId && s.EggType == request.EggType)
            .ToListAsync();
        var totalSold = sales.Sum(x => x.Quantity);

        var available = totalProduced - totalSold;
        if (available < 0) available = 0;

        if (request.Quantity > available)
            return BadRequest($"Stock insuficiente para {request.EggType}. Disponible: {available}");

        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

        var sale = new Sale
        {
            Id = Guid.NewGuid(),
            HenBatchId = request.HenBatchId,
            CustomerId = request.CustomerId,
            Date = request.Date.Date,
            EggType = request.EggType,
            Quantity = request.Quantity,
            UnitPrice = request.UnitPrice,
            PaymentType = request.PaymentType,
            SoldById = userId
        };

        if (sale.PaymentType == PaymentType.Credito)
        {
            sale.CreditStatus = CreditStatus.Pendiente;
            sale.AmountPaid = 0;
            sale.PendingAmount = sale.Total;
        }
        else
        {
            sale.CreditStatus = CreditStatus.Cancelado;
            sale.AmountPaid = sale.Total;
            sale.PendingAmount = 0;
            sale.PaidAt = DateTime.UtcNow;
        }

        await _db.Sales.InsertOneAsync(sale);
        return Ok(sale);
    }

    public record PaymentRequest(decimal Amount);

    [HttpPost("{id:guid}/payments")]
    public async Task<IActionResult> AddPayment(Guid id, [FromBody] PaymentRequest request)
    {
        if (request.Amount <= 0)
            return BadRequest("El monto debe ser mayor a cero.");

        var sale = await _db.Sales.Find(s => s.Id == id).FirstOrDefaultAsync();
        if (sale is null)
            return NotFound("La venta no existe.");

        if (sale.PaymentType != PaymentType.Credito)
            return BadRequest("Solo las ventas a cr�dito permiten abonos.");

        if (sale.PendingAmount <= 0)
            return BadRequest("La deuda ya est� cancelada.");

        if (request.Amount > sale.PendingAmount)
            return BadRequest("El abono no puede ser mayor al saldo pendiente.");

        // aplicar abono
        sale.AmountPaid += request.Amount;
        sale.PendingAmount -= request.Amount;

        // actualizar estado seg�n tu enum actual
        if (sale.PendingAmount == 0)
        {
            sale.CreditStatus = CreditStatus.Cancelado;
            sale.PaidAt = DateTime.UtcNow;
        }
        else
        {
            sale.CreditStatus = CreditStatus.Pendiente;
            sale.PaidAt = null;
        }

        await _db.Sales.ReplaceOneAsync(s => s.Id == id, sale);

        return Ok(new
        {
            message = "Abono registrado correctamente",
            saleId = sale.Id,
            amountPaid = sale.AmountPaid,
            pendingAmount = sale.PendingAmount,
            creditStatus = sale.CreditStatus.ToString()
        });
    }
}