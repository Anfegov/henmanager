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
}