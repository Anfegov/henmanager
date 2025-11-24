using HenManager.Api.Data;
using HenManager.Api.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace HenManager.Api.Controllers;

[ApiController]
[Route("api/credits")]
[Authorize(Policy = "ViewSales")]
public class CreditController : ControllerBase
{
    private readonly MongoDbContext _db;
    public CreditController(MongoDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Sale>>> GetCredits(
        [FromQuery] Guid? customerId,
        [FromQuery] Guid? henBatchId)
    {
        var filter = Builders<Sale>.Filter.Eq(s => s.PaymentType, PaymentType.Credito);

        if (customerId.HasValue)
            filter &= Builders<Sale>.Filter.Eq(s => s.CustomerId, customerId.Value);

        if (henBatchId.HasValue)
            filter &= Builders<Sale>.Filter.Eq(s => s.HenBatchId, henBatchId.Value);

        var list = await _db.Sales.Find(filter)
            .SortByDescending(s => s.Date)
            .ToListAsync();

        return Ok(list);
    }

    [HttpPut("{id:guid}/pay")]
    [Authorize(Policy = "RegisterPayment")]
    public async Task<ActionResult<Sale>> RegisterPayment(Guid id, [FromBody] decimal amount)
    {
        if (amount <= 0) return BadRequest("El abono debe ser mayor a 0.");

        var sale = await _db.Sales.Find(s => s.Id == id).FirstOrDefaultAsync();
        if (sale is null) return NotFound();

        if (sale.CreditStatus == CreditStatus.Cancelado)
            return BadRequest("El crédito ya está cancelado.");

        sale.AmountPaid += amount;
        sale.PendingAmount = sale.Total - sale.AmountPaid;

        if (sale.PendingAmount <= 0)
        {
            sale.PendingAmount = 0;
            sale.CreditStatus = CreditStatus.Cancelado;
            sale.PaidAt = DateTime.UtcNow;
        }

        await _db.Sales.ReplaceOneAsync(s => s.Id == id, sale);
        return Ok(sale);
    }

    [HttpPut("{id:guid}/cancel")]
    [Authorize(Policy = "CancelCredit")]
    public async Task<ActionResult<Sale>> CancelCredit(Guid id)
    {
        var sale = await _db.Sales.Find(s => s.Id == id).FirstOrDefaultAsync();
        if (sale is null) return NotFound();

        if (sale.PaymentType != PaymentType.Credito)
            return BadRequest("La venta no es a crédito.");

        sale.CreditStatus = CreditStatus.Cancelado;
        sale.PendingAmount = 0;
        sale.AmountPaid = sale.Total;
        sale.PaidAt = DateTime.UtcNow;

        await _db.Sales.ReplaceOneAsync(s => s.Id == id, sale);
        return Ok(sale);
    }
}