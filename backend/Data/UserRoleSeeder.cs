using HenManager.Api.Domain;
using Microsoft.AspNetCore.Identity;
using MongoDB.Driver;

namespace HenManager.Api.Data;

/// <summary>
/// Seeds an Admin role with ALL current permission UUIDs, and ensures an admin user exists.
/// If the role already exists, it is updated to include any new permissions.
/// </summary>
public static class UserRoleSeeder
{
    public static async Task SeedAsync(IMongoDbContext db, IPasswordHasher<User> hasher)
    {
        // 1) Ensure Admin role exists and has all permission IDs
        var allPermIds = await db.Permissions.Find(_ => true)
            .Project(p => p.Id)
            .ToListAsync();

        var adminRole = await db.Roles.Find(r => r.Name == "Admin").FirstOrDefaultAsync();

        if (adminRole is null)
        {
            adminRole = new Role
            {
                Id = Guid.NewGuid(),
                Name = "Admin",
                PermissionIds = allPermIds.Distinct().ToList()
            };

            await db.Roles.InsertOneAsync(adminRole);
        }
        else
        {
            adminRole.PermissionIds = allPermIds.Distinct().ToList();
            await db.Roles.ReplaceOneAsync(r => r.Id == adminRole.Id, adminRole);
        }

        // 2) Ensure at least one admin user exists
        var adminUser = await db.Users.Find(u => u.UserName == "admin").FirstOrDefaultAsync();
        if (adminUser is null)
        {
            adminUser = new User
            {
                Id = Guid.NewGuid(),
                UserName = "admin",
                IsActive = true,
                RoleIds = new List<Guid> { adminRole.Id }
            };

            adminUser.PasswordHash = hasher.HashPassword(adminUser, "Admin123*");
            await db.Users.InsertOneAsync(adminUser);
        }
        else
        {
            if (!adminUser.RoleIds.Contains(adminRole.Id))
            {
                adminUser.RoleIds.Add(adminRole.Id);
                await db.Users.ReplaceOneAsync(u => u.Id == adminUser.Id, adminUser);
            }
        }
    }
}