using HenManager.Api.Data;
using HenManager.Api.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace HenManager.Api.Controllers;

public record CreateUserRequest(string UserName, string Password, List<Guid> RoleIds);
public record UpdateUserRequest(string UserName, bool IsActive, List<Guid> RoleIds);

[ApiController]
[Route("api/users")]
[Authorize(Policy = "ManageUsers")]
public class UserController : ControllerBase
{
    private readonly IMongoDbContext _db;
    private readonly IPasswordHasher<User> _hasher;

    public UserController(IMongoDbContext db, IPasswordHasher<User> hasher)
    {
        _db = db;
        _hasher = hasher;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<User>>> GetAll()
    {
        var list = await _db.Users.Find(_ => true)
            .SortBy(u => u.UserName)
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<User>> GetById(Guid id)
    {
        var user = await _db.Users.Find(u => u.Id == id).FirstOrDefaultAsync();
        if (user is null) return NotFound();
        return Ok(user);
    }

    [HttpPost]
    public async Task<ActionResult<User>> Create(CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserName) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("UserName y Password son obligatorios.");

        var userName = request.UserName.Trim();
        var exists = await _db.Users.Find(u => u.UserName == userName).AnyAsync();
        if (exists) return Conflict("El usuario ya existe.");

        var roleIds = request.RoleIds ?? new List<Guid>();
        if (roleIds.Any())
        {
            var countValid = await _db.Roles.Find(r => roleIds.Contains(r.Id)).CountDocumentsAsync();
            if (countValid != roleIds.Distinct().Count())
                return BadRequest("Existen roles inválidos.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            UserName = userName,
            IsActive = true,
            RoleIds = roleIds.Distinct().ToList(),
        };

        user.PasswordHash = _hasher.HashPassword(user, request.Password);

        await _db.Users.InsertOneAsync(user);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<User>> Update(Guid id, UpdateUserRequest request)
    {
        var user = await _db.Users.Find(u => u.Id == id).FirstOrDefaultAsync();
        if (user is null) return NotFound();

        if (string.IsNullOrWhiteSpace(request.UserName))
            return BadRequest("UserName es obligatorio.");

        var userName = request.UserName.Trim();
        var exists = await _db.Users.Find(u => u.UserName == userName && u.Id != id).AnyAsync();
        if (exists) return Conflict("Ya existe otro usuario con ese UserName.");

        var roleIds = request.RoleIds ?? new List<Guid>();
        if (roleIds.Any())
        {
            var countValid = await _db.Roles.Find(r => roleIds.Contains(r.Id)).CountDocumentsAsync();
            if (countValid != roleIds.Distinct().Count())
                return BadRequest("Existen roles inválidos.");
        }

        user.UserName = userName;
        user.IsActive = request.IsActive;
        user.RoleIds = roleIds.Distinct().ToList();

        await _db.Users.ReplaceOneAsync(u => u.Id == id, user);
        return Ok(user);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _db.Users.DeleteOneAsync(u => u.Id == id);
        if (result.DeletedCount == 0) return NotFound();
        return NoContent();
    }
}