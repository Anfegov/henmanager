using HenManager.Api.Data;
using HenManager.Api.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace HenManager.Api.Controllers;

public record StockByTypeDto(EggType EggType, int Available, int Produced, int Sold);

[ApiController]
[Route("api/stock")]
[Authorize(Policy = "ViewSales")]
public class StockController : ControllerBase
{
    private readonly MongoDbContext _db;
    public StockController(MongoDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<StockByTypeDto>>> GetStock([FromQuery] Guid henBatchId)
    {
        var productions = await _db.EggProductions.Find(p => p.HenBatchId == henBatchId).ToListAsync();
        var sales = await _db.Sales.Find(s => s.HenBatchId == henBatchId && s.EggType != null).ToListAsync();

        var result = Enum.GetValues<EggType>()
            .Select(t =>
            {
                var produced = productions.Where(p => p.EggType == t).Sum(p => p.Quantity);
                var sold = sales.Where(s => s.EggType == t).Sum(s => s.Quantity);
                var available = produced - sold;
                if (available < 0) available = 0;
                return new StockByTypeDto(t, available, produced, sold);
            })
            .ToList();

        return Ok(result);
    }
}