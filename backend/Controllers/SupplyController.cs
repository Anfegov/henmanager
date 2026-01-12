using HenManager.Api.Data;
using HenManager.Api.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace HenManager.Api.Controllers;

[ApiController]
[Route("api/supplies")]
public class SupplyController : ControllerBase
{
    private readonly MongoDbContext _db;
    public SupplyController(MongoDbContext db) => _db = db;

    [HttpGet]
    [Authorize(Policy = "ViewSupplies")]
    public async Task<ActionResult<IEnumerable<Supply>>> GetAll([FromQuery] Guid? henBatchId)
    {
        var filter = henBatchId.HasValue
            ? Builders<Supply>.Filter.Eq(s => s.HenBatchId, henBatchId.Value)
            : Builders<Supply>.Filter.Empty;

        var list = await _db.Supplies.Find(filter).SortByDescending(s => s.Date).ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    [Authorize(Policy = "RegisterSupply")]
    public async Task<ActionResult<Supply>> Create(Supply request)
    {
        if (request.HenBatchId == Guid.Empty) return BadRequest("Camada inválida.");
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest("Nombre inválido.");
        if (request.Quantity <= 0) return BadRequest("Cantidad inválida.");

        var batch = await _db.HenBatches.Find(b => b.Id == request.HenBatchId).FirstOrDefaultAsync();
        if (batch is null) return BadRequest("Camada no existe.");

        request.Id = Guid.NewGuid();
        request.Date = request.Date == default ? DateTime.UtcNow.Date : request.Date.Date;
        request.RegisteredById = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

        await _db.Supplies.InsertOneAsync(request);
        return Ok(request);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "RegisterSupply")]
    public async Task<ActionResult<Supply>> Update(Guid id, Supply request)
    {
        var supply = await _db.Supplies.Find(s => s.Id == id).FirstOrDefaultAsync();
        if (supply is null) return NotFound("Insumo no encontrado.");

        if (request.HenBatchId != Guid.Empty && request.HenBatchId != supply.HenBatchId)
        {
            var batch = await _db.HenBatches.Find(b => b.Id == request.HenBatchId).FirstOrDefaultAsync();
            if (batch is null) return BadRequest("Camada no existe.");
            supply.HenBatchId = request.HenBatchId;
        }

        supply.Name = !string.IsNullOrWhiteSpace(request.Name) ? request.Name.Trim() : supply.Name;
        supply.Quantity = request.Quantity > 0 ? request.Quantity : supply.Quantity;
        supply.Unit = !string.IsNullOrWhiteSpace(request.Unit) ? request.Unit.Trim() : supply.Unit;
        supply.Cost = request.Cost ?? supply.Cost;
        supply.Date = request.Date != default ? request.Date.Date : supply.Date;

        await _db.Supplies.ReplaceOneAsync(s => s.Id == id, supply);
        return Ok(supply);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RegisterSupply")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _db.Supplies.DeleteOneAsync(s => s.Id == id);
        if (result.DeletedCount == 0) return NotFound("Insumo no encontrado.");
        return Ok(new { message = "Insumo eliminado correctamente." });
    }
}