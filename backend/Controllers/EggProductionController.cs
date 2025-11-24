using HenManager.Api.Data;
using HenManager.Api.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Security.Claims;

namespace HenManager.Api.Controllers;

[ApiController]
[Route("api/egg-productions")]
[Authorize]
public class EggProductionController : ControllerBase
{
    private readonly MongoDbContext _db;
    public EggProductionController(MongoDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EggProduction>>> GetAll([FromQuery] Guid? henBatchId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var filter = Builders<EggProduction>.Filter.Empty;

        if (henBatchId.HasValue && henBatchId.Value != Guid.Empty)
            filter &= Builders<EggProduction>.Filter.Eq(x => x.HenBatchId, henBatchId.Value);

        if (from.HasValue)
            filter &= Builders<EggProduction>.Filter.Gte(x => x.Date, from.Value.Date);

        if (to.HasValue)
            filter &= Builders<EggProduction>.Filter.Lte(x => x.Date, to.Value.Date);

        var list = await _db.EggProductions.Find(filter).SortByDescending(x => x.Date).ToListAsync();
        return Ok(list);
    }

    [HttpPost("RegisterDailyProduction")]
    public async Task<ActionResult<EggProduction>> RegisterDailyProduction([FromBody] EggProduction request)
    {
        if (request.Quantity <= 0) return BadRequest("Cantidad inválida.");
        if (request.HenBatchId == Guid.Empty) return BadRequest("Camada inválida.");

        var batch = await _db.HenBatches.Find(b => b.Id == request.HenBatchId).FirstOrDefaultAsync();
        if (batch is null) return BadRequest("Camada no existe.");
        if (!batch.IsActive) return BadRequest("Camada cerrada.");

        request.Id = Guid.NewGuid();
        request.Date = request.Date == default ? DateTime.UtcNow.Date : request.Date.Date;
        request.RegisteredById = GetUserId();

        await _db.EggProductions.InsertOneAsync(request);
        return Ok(request);
    }

    private Guid GetUserId()
    {
        var idStr =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub") ??
            User.FindFirstValue("userId");

        return Guid.TryParse(idStr, out var id) ? id : Guid.Empty;
    }
}