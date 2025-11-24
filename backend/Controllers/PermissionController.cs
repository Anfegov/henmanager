using HenManager.Api.Data;
using HenManager.Api.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace HenManager.Api.Controllers;

[ApiController]
[Route("api/permissions")]
[Authorize(Policy = "ManageRoles")]
public class PermissionController : ControllerBase
{
    private readonly MongoDbContext _db;
    public PermissionController(MongoDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PermissionEntity>>> GetAll()
    {
        var list = await _db.Permissions.Find(_ => true).SortBy(p => p.Code).ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<PermissionEntity>> Create(PermissionEntity request)
    {
        if (string.IsNullOrWhiteSpace(request.Code) || string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Code y Name son obligatorios.");

        request.Code = request.Code.Trim();
        request.Name = request.Name.Trim();

        var exists = await _db.Permissions.Find(p => p.Code == request.Code).AnyAsync();
        if (exists) return Conflict($"El permiso '{request.Code}' ya existe.");

        request.Id = Guid.NewGuid();
        await _db.Permissions.InsertOneAsync(request);
        return Ok(request);
    }
}