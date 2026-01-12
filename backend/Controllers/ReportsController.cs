using HenManager.Api.Data;
using HenManager.Api.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace HenManager.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Policy = "ViewReports")]
public class ReportsController : ControllerBase
{
    private readonly MongoDbContext _db;
    public ReportsController(MongoDbContext db) => _db = db;

    [HttpGet("summary")]
    public async Task<ActionResult<object>> Summary([FromQuery] Guid? henBatchId)
    {
        var salesFilter = henBatchId.HasValue
            ? Builders<Sale>.Filter.Eq(s => s.HenBatchId, henBatchId.Value)
            : Builders<Sale>.Filter.Empty;

        var sales = await _db.Sales.Find(salesFilter).ToListAsync();
        var supplies = await _db.Supplies.Find(_ => true).ToListAsync();

        var totalSales = sales.Sum(s => s.Total);
        var totalSuppliesCost = supplies.Sum(s => s.Cost ?? 0);

        return Ok(new
        {
            totalSales,
            totalSuppliesCost,
            profit = totalSales - totalSuppliesCost
        });
    }

    [HttpGet("monthly-profit")]
    public async Task<ActionResult<object>> MonthlyProfit([FromQuery] int year, [FromQuery] int month)
    {
        if (month < 1 || month > 12)
            return BadRequest("El mes debe estar entre 1 y 12.");

        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1).AddDays(-1);

        var salesFilter = Builders<Sale>.Filter.And(
            Builders<Sale>.Filter.Gte(s => s.Date, startDate),
            Builders<Sale>.Filter.Lte(s => s.Date, endDate)
        );

        var suppliesFilter = Builders<Supply>.Filter.And(
            Builders<Supply>.Filter.Gte(s => s.Date, startDate),
            Builders<Supply>.Filter.Lte(s => s.Date, endDate)
        );

        var sales = await _db.Sales.Find(salesFilter).ToListAsync();
        var supplies = await _db.Supplies.Find(suppliesFilter).ToListAsync();

        var totalSales = sales.Sum(s => s.Total);
        var totalSupplies = supplies.Sum(s => s.Cost ?? 0);

        return Ok(new
        {
            year,
            month,
            totalSales,
            totalSupplies,
            profit = totalSales - totalSupplies
        });
    }
}