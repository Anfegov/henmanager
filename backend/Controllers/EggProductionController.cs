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
    [Authorize(Policy = "ViewProduction")]
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
    [Authorize(Policy = "RegisterDailyProduction")]
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

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "RegisterDailyProduction")]
    public async Task<ActionResult<EggProduction>> Update(Guid id, [FromBody] EggProduction request)
    {
        var production = await _db.EggProductions.Find(p => p.Id == id).FirstOrDefaultAsync();
        if (production is null) return NotFound("Registro no encontrado.");

        if (request.HenBatchId != Guid.Empty && request.HenBatchId != production.HenBatchId)
        {
            var batch = await _db.HenBatches.Find(b => b.Id == request.HenBatchId).FirstOrDefaultAsync();
            if (batch is null) return BadRequest("Camada no existe.");
            production.HenBatchId = request.HenBatchId;
        }

        if (request.Quantity > 0)
            production.Quantity = request.Quantity;

        if (request.Date != default)
            production.Date = request.Date.Date;

        production.EggType = request.EggType;

        await _db.EggProductions.ReplaceOneAsync(p => p.Id == id, production);
        return Ok(production);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RegisterDailyProduction")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _db.EggProductions.DeleteOneAsync(p => p.Id == id);
        if (result.DeletedCount == 0) return NotFound("Registro no encontrado.");
        return Ok(new { message = "Registro eliminado correctamente." });
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