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

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Sale>>> GetAll()
    {
        var list = await _db.Sales.Find(_ => true)
            .SortByDescending(s => s.Date)
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    [Authorize(Policy = "RegisterSale")]
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
            return BadRequest("Solo las ventas a crédito permiten abonos.");

        if (sale.PendingAmount <= 0)
            return BadRequest("La deuda ya está cancelada.");

        if (request.Amount > sale.PendingAmount)
            return BadRequest("El abono no puede ser mayor al saldo pendiente.");

        // aplicar abono
        sale.AmountPaid += request.Amount;
        sale.PendingAmount -= request.Amount;

        // actualizar estado según tu enum actual
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