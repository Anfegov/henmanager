using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HenManager.Api.Data;
using HenManager.Api.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;

namespace HenManager.Api.Controllers;

public record LoginRequest(string UserName, string Password);
public record LoginResponse(string Token, UserSummaryDto User);
public record RoleSummaryDto(Guid Id, string Name);
public record UserSummaryDto(Guid Id, string UserName, bool IsActive, List<RoleSummaryDto> Roles, List<string> Permissions);

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IMongoDbContext _db;
    private readonly IPasswordHasher<User> _hasher;
    private readonly IConfiguration _config;

    public AuthController(IMongoDbContext db, IPasswordHasher<User> hasher, IConfiguration config)
    {
        _db = db;
        _hasher = hasher;
        _config = config;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var user = await _db.Users.Find(u => u.UserName == request.UserName).FirstOrDefaultAsync();
        if (user is null || !user.IsActive)
            return Unauthorized("Usuario o contraseña inválidos.");

        var verify = _hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verify == PasswordVerificationResult.Failed)
            return Unauthorized("Usuario o contraseña inválidos.");

        var roles = await _db.Roles.Find(r => user.RoleIds.Contains(r.Id)).ToListAsync();

        // Nuevos permisos por UUID
        var permIds = roles.SelectMany(r => r.PermissionIds).Distinct().ToList();
        var permEntities = permIds.Any()
            ? await _db.Permissions.Find(p => permIds.Contains(p.Id)).ToListAsync()
            : new List<PermissionEntity>();
        var permCodes = permEntities.Select(p => p.Code).ToList();

        // Compatibilidad con roles viejos que guardaban códigos
        var legacyCodes = roles
            .Where(r => (r.PermissionIds == null || r.PermissionIds.Count == 0) && r.LegacyPermissionCodes != null)
            .SelectMany(r => r.LegacyPermissionCodes!)
            .ToList();

        permCodes.AddRange(legacyCodes);

        permCodes = permCodes.Distinct(StringComparer.OrdinalIgnoreCase).ToList();

        var token = GenerateToken(user, roles, permCodes);

        var summary = new UserSummaryDto(
            user.Id,
            user.UserName,
            user.IsActive,
            roles.Select(r => new RoleSummaryDto(r.Id, r.Name)).ToList(),
            permCodes
        );

        return Ok(new LoginResponse(token, summary));
    }

    private string GenerateToken(User user, List<Role> roles, List<string> permissions)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.UserName),
        };

        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role.Name));

        foreach (var perm in permissions)
            claims.Add(new Claim("permission", perm));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var jwt = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(jwt);
    }
}