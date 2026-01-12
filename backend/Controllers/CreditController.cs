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

    public record CreditSummaryDto(
    decimal TotalDebt,
    decimal TotalPaid,
    decimal TotalPending,
    int CountCustomersInDebt);

    public class CustomerDebtDto
    {
        public Guid CustomerId { get; set; }
        public string CustomerName { get; set; } = "";
        public decimal TotalDebt { get; set; }
        public decimal TotalPaid { get; set; }
        public decimal TotalPending { get; set; }
        public List<CreditSaleDto> Sales { get; set; } = new();
    }

    public class CreditSaleDto
    {
        public Guid SaleId { get; set; }
        public DateTime Date { get; set; }
        public decimal Total { get; set; }
        public decimal AmountPaid { get; set; }
        public decimal PendingAmount { get; set; }
        public string CreditStatus { get; set; } = "";
    }

    [HttpGet("summary")]
    public async Task<ActionResult<CreditSummaryDto>> GetSummary()
    {
        var credits = await _db.Sales
            .Find(s => s.PaymentType == PaymentType.Credito)
            .ToListAsync();

        var totalDebt = credits.Sum(s => s.Total);
        var totalPaid = credits.Sum(s => s.AmountPaid);
        var totalPending = credits.Sum(s => s.PendingAmount);
        var countCustomersInDebt = credits
            .Where(s => s.PendingAmount > 0)
            .Select(s => s.CustomerId)
            .Distinct()
            .Count();

        return Ok(new CreditSummaryDto(totalDebt, totalPaid, totalPending, countCustomersInDebt));
    }

    [HttpGet("customers")]
    public async Task<ActionResult<IEnumerable<CustomerDebtDto>>> GetCustomersInDebt()
    {
        var creditSales = await _db.Sales.Find(s =>
                s.PaymentType == PaymentType.Credito &&
                s.PendingAmount > 0)
            .SortByDescending(s => s.Date)
            .ToListAsync();

        if (!creditSales.Any())
            return Ok(new List<CustomerDebtDto>());

        var customerIds = creditSales.Select(s => s.CustomerId).Distinct().ToList();
        var customers = await _db.Customers.Find(c => customerIds.Contains(c.Id)).ToListAsync();
        var customerMap = customers.ToDictionary(c => c.Id, c => c);

        var grouped = creditSales
            .GroupBy(s => s.CustomerId)
            .Select(g =>
            {
                customerMap.TryGetValue(g.Key, out var cust);
                return new CustomerDebtDto
                {
                    CustomerId = g.Key,
                    CustomerName = cust?.Name ?? "Cliente",
                    TotalDebt = g.Sum(x => x.Total),
                    TotalPaid = g.Sum(x => x.AmountPaid),
                    TotalPending = g.Sum(x => x.PendingAmount),
                    Sales = g.OrderByDescending(x => x.Date).Select(x => new CreditSaleDto
                    {
                        SaleId = x.Id,
                        Date = x.Date,
                        Total = x.Total,
                        AmountPaid = x.AmountPaid,
                        PendingAmount = x.PendingAmount,
                        CreditStatus = x.CreditStatus.ToString()
                    }).ToList()
                };
            })
            .OrderByDescending(x => x.TotalPending)
            .ToList();

        return Ok(grouped);
    }

    [HttpGet("customers/{id:guid}")]
    public async Task<ActionResult<CustomerDebtDto>> GetCustomerDebt(Guid id)
    {
        var creditSales = await _db.Sales.Find(s =>
                s.PaymentType == PaymentType.Credito &&
                s.CustomerId == id)
            .SortByDescending(s => s.Date)
            .ToListAsync();

        if (!creditSales.Any())
            return NotFound();

        var customer = await _db.Customers.Find(c => c.Id == id).FirstOrDefaultAsync();

        var dto = new CustomerDebtDto
        {
            CustomerId = id,
            CustomerName = customer?.Name ?? "Cliente",
            TotalDebt = creditSales.Sum(x => x.Total),
            TotalPaid = creditSales.Sum(x => x.AmountPaid),
            TotalPending = creditSales.Sum(x => x.PendingAmount),
            Sales = creditSales.Select(x => new CreditSaleDto
            {
                SaleId = x.Id,
                Date = x.Date,
                Total = x.Total,
                AmountPaid = x.AmountPaid,
                PendingAmount = x.PendingAmount,
                CreditStatus = x.CreditStatus.ToString()
            }).ToList()
        };

        return Ok(dto);
    }

}