using HenManager.Api.Data;
using HenManager.Api.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace HenManager.Api.Controllers;

public record CreateEggTypeRequest(string Name, string? Description, int DisplayOrder = 0);
public record UpdateEggTypeRequest(string Name, string? Description, bool IsActive, int DisplayOrder);

[ApiController]
[Route("api/egg-types")]
[Authorize]
public class EggTypeController : ControllerBase
{
    private readonly MongoDbContext _db;
    public EggTypeController(MongoDbContext db) => _db = db;

    [HttpGet]
    [Authorize(Policy = "ViewEggTypes")]
    public async Task<ActionResult<IEnumerable<EggTypeEntity>>> GetAll([FromQuery] bool? activeOnly)
    {
        var filter = activeOnly == true
            ? Builders<EggTypeEntity>.Filter.Eq(e => e.IsActive, true)
            : Builders<EggTypeEntity>.Filter.Empty;

        var list = await _db.EggTypes
            .Find(filter)
            .SortBy(e => e.DisplayOrder)
            .ThenBy(e => e.Name)
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "ViewEggTypes")]
    public async Task<ActionResult<EggTypeEntity>> GetById(Guid id)
    {
        var eggType = await _db.EggTypes.Find(e => e.Id == id).FirstOrDefaultAsync();
        if (eggType is null) return NotFound();
        return Ok(eggType);
    }

    [HttpPost]
    [Authorize(Policy = "CreateEggType")]
    public async Task<ActionResult<EggTypeEntity>> Create(CreateEggTypeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("El nombre es obligatorio.");

        // Verificar nombre único
        var exists = await _db.EggTypes
            .Find(e => e.Name.ToLower() == request.Name.ToLower())
            .AnyAsync();

        if (exists)
            return BadRequest("Ya existe un tipo de huevo con ese nombre.");

        var eggType = new EggTypeEntity
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            IsActive = true,
            DisplayOrder = request.DisplayOrder
        };

        await _db.EggTypes.InsertOneAsync(eggType);
        return CreatedAtAction(nameof(GetById), new { id = eggType.Id }, eggType);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "EditEggType")]
    public async Task<ActionResult<EggTypeEntity>> Update(Guid id, UpdateEggTypeRequest request)
    {
        var eggType = await _db.EggTypes.Find(e => e.Id == id).FirstOrDefaultAsync();
        if (eggType is null) return NotFound();

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("El nombre es obligatorio.");

        // Verificar nombre único (excluyendo el actual)
        var exists = await _db.EggTypes
            .Find(e => e.Name.ToLower() == request.Name.ToLower() && e.Id != id)
            .AnyAsync();

        if (exists)
            return BadRequest("Ya existe un tipo de huevo con ese nombre.");

        eggType.Name = request.Name.Trim();
        eggType.Description = request.Description?.Trim();
        eggType.IsActive = request.IsActive;
        eggType.DisplayOrder = request.DisplayOrder;

        await _db.EggTypes.ReplaceOneAsync(e => e.Id == id, eggType);
        return Ok(eggType);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "DeleteEggType")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var eggType = await _db.EggTypes.Find(e => e.Id == id).FirstOrDefaultAsync();
        if (eggType is null) return NotFound();

        // Verificar si está en uso en producciones o ventas
        // Por ahora solo desactivamos en lugar de eliminar
        eggType.IsActive = false;
        await _db.EggTypes.ReplaceOneAsync(e => e.Id == id, eggType);

        return Ok(new { message = "Tipo de huevo desactivado." });
    }
}
