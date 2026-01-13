using HenManager.Api.Data;
using HenManager.Api.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace HenManager.Api.Controllers;

[ApiController]
[Route("api/batches")]
public class HenBatchController : ControllerBase
{
    private readonly MongoDbContext _db;
    public HenBatchController(MongoDbContext db) => _db = db;

    [HttpGet]
    [Authorize(Policy = "ViewBatches")]
    public async Task<ActionResult<IEnumerable<HenBatch>>> GetAll()
    {
        var list = await _db.HenBatches.Find(_ => true)
            .SortByDescending(b => b.StartDate)
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "ViewBatches")]
    public async Task<ActionResult<HenBatch>> GetById(Guid id)
    {
        var batch = await _db.HenBatches.Find(b => b.Id == id).FirstOrDefaultAsync();
        if (batch is null) return NotFound();
        return Ok(batch);
    }

    [HttpPost]
    [Authorize(Policy = "CreateBatch")]
    public async Task<ActionResult<HenBatch>> Create(HenBatch request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("El nombre es obligatorio.");

        request.Id = Guid.NewGuid();
        request.Name = request.Name.Trim();
        request.StartDate = request.StartDate == default ? DateTime.UtcNow.Date : request.StartDate.Date;
        request.IsActive = true;

        await _db.HenBatches.InsertOneAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = request.Id }, request);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "EditBatch")]
    public async Task<ActionResult<HenBatch>> Update(Guid id, HenBatch request)
    {
        var batch = await _db.HenBatches.Find(b => b.Id == id).FirstOrDefaultAsync();
        if (batch is null) return NotFound();

        batch.Name = request.Name?.Trim() ?? batch.Name;
        batch.StartDate = request.StartDate == default ? batch.StartDate : request.StartDate.Date;
        batch.HensCount = request.HensCount > 0 ? request.HensCount : batch.HensCount;
        batch.Notes = request.Notes ?? batch.Notes;

        await _db.HenBatches.ReplaceOneAsync(b => b.Id == id, batch);
        return Ok(batch);
    }

    [HttpPut("{id:guid}/close")]
    [Authorize(Policy = "CloseBatch")]
    public async Task<ActionResult<HenBatch>> Close(Guid id)
    {
        var batch = await _db.HenBatches.Find(b => b.Id == id).FirstOrDefaultAsync();
        if (batch is null) return NotFound();

        if (!batch.IsActive)
            return BadRequest("La camada ya está cerrada.");

        batch.IsActive = false;
        batch.EndDate = DateTime.UtcNow.Date;

        await _db.HenBatches.ReplaceOneAsync(b => b.Id == id, batch);
        return Ok(batch);
    }
}