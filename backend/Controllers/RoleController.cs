using HenManager.Api.Data;
using HenManager.Api.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace HenManager.Api.Controllers;

public record RoleRequest(string Name, List<Guid> PermissionIds);

[ApiController]
[Route("api/roles")]
[Authorize]
public class RoleController : ControllerBase
{
    private readonly MongoDbContext _db;
    public RoleController(MongoDbContext db) => _db = db;

    [HttpGet]
    [Authorize(Policy = "ViewRoles")]
    public async Task<ActionResult<IEnumerable<Role>>> GetAll()
    {
        var list = await _db.Roles.Find(_ => true)
            .SortBy(r => r.Name)
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "ViewRoles")]
    public async Task<ActionResult<Role>> GetById(Guid id)
    {
        var role = await _db.Roles.Find(r => r.Id == id).FirstOrDefaultAsync();
        if (role is null) return NotFound();
        return Ok(role);
    }

    [HttpGet("permissions")]
    [Authorize(Policy = "ViewRoles")]
    public async Task<ActionResult<IEnumerable<PermissionEntity>>> GetPermissions()
    {
        var list = await _db.Permissions.Find(_ => true)
            .SortBy(p => p.Code)
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    [Authorize(Policy = "CreateRole")]
    public async Task<ActionResult<Role>> Create(RoleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("El nombre es obligatorio.");

        var exists = await _db.Roles.Find(r => r.Name == request.Name.Trim()).AnyAsync();
        if (exists) return Conflict($"Ya existe un rol con nombre '{request.Name}'.");

        var ids = request.PermissionIds ?? new List<Guid>();
        var validCount = await _db.Permissions.Find(p => ids.Contains(p.Id)).CountDocumentsAsync();
        if (validCount != ids.Distinct().Count())
            return BadRequest("Existen permisos inválidos (UUID no encontrados).");

        var role = new Role
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            PermissionIds = ids.Distinct().ToList()
        };

        await _db.Roles.InsertOneAsync(role);
        return CreatedAtAction(nameof(GetById), new { id = role.Id }, role);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "EditRole")]
    public async Task<ActionResult<Role>> Update(Guid id, RoleRequest request)
    {
        var role = await _db.Roles.Find(r => r.Id == id).FirstOrDefaultAsync();
        if (role is null) return NotFound();

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("El nombre es obligatorio.");

        var ids = request.PermissionIds ?? new List<Guid>();
        var validCount = await _db.Permissions.Find(p => ids.Contains(p.Id)).CountDocumentsAsync();
        if (validCount != ids.Distinct().Count())
            return BadRequest("Existen permisos inválidos (UUID no encontrados).");

        role.Name = request.Name.Trim();
        role.PermissionIds = ids.Distinct().ToList();

        await _db.Roles.ReplaceOneAsync(r => r.Id == id, role);
        return Ok(role);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "DeleteRole")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var inUse = await _db.Users.Find(u => u.RoleIds.Contains(id)).AnyAsync();
        if (inUse) return BadRequest("No se puede eliminar el rol porque está asignado a usuarios.");

        var result = await _db.Roles.DeleteOneAsync(r => r.Id == id);
        if (result.DeletedCount == 0) return NotFound();
        return NoContent();
    }
}