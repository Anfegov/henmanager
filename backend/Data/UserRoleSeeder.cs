using HenManager.Api.Domain;
using Microsoft.AspNetCore.Identity;
using MongoDB.Driver;

namespace HenManager.Api.Data;

/// <summary>
/// Seeds predefined roles with specific permissions, and ensures an admin user exists.
/// </summary>
public static class UserRoleSeeder
{
    public static async Task SeedAsync(IMongoDbContext db, IPasswordHasher<User> hasher)
    {
        // Obtener todos los permisos indexados por Code
        var allPerms = await db.Permissions.Find(_ => true).ToListAsync();
        var permByCode = allPerms.ToDictionary(p => p.Code, p => p.Id);

        // Helper para obtener IDs de permisos por código
        List<Guid> GetPermIds(params string[] codes) =>
            codes.Where(c => permByCode.ContainsKey(c)).Select(c => permByCode[c]).ToList();

        // Definir roles predefinidos
        var roleDefs = new Dictionary<string, List<Guid>>
        {
            // Admin: Todos los permisos
            ["Admin"] = allPerms.Select(p => p.Id).ToList(),

            // Operador: Producción diaria (camadas, producción, insumos)
            ["Operador"] = GetPermIds(
                "ViewBatches", "CreateBatch",
                "ViewProduction", "CreateProduction", "EditProduction",
                "ViewSupplies", "CreateSupply",
                "ViewEggTypes",
                "ViewDashboard"
            ),

            // Vendedor: Ventas y clientes
            ["Vendedor"] = GetPermIds(
                "ViewBatches",
                "ViewSales", "CreateSale",
                "ViewCustomers", "CreateCustomer", "EditCustomer",
                "ViewCredits", "RegisterPayment",
                "ViewEggTypes",
                "ViewDashboard"
            ),

            // Supervisor: Vista y edición de todo excepto usuarios/roles
            ["Supervisor"] = GetPermIds(
                "ViewBatches", "CreateBatch", "EditBatch", "CloseBatch",
                "ViewProduction", "CreateProduction", "EditProduction", "DeleteProduction",
                "ViewSales", "CreateSale", "EditSale", "DeleteSale",
                "ViewSupplies", "CreateSupply", "EditSupply", "DeleteSupply",
                "ViewCustomers", "CreateCustomer", "EditCustomer", "DeleteCustomer",
                "ViewCredits", "RegisterPayment", "CancelCredit",
                "ViewEggTypes", "CreateEggType", "EditEggType",
                "ViewReports",
                "ViewDashboard"
            ),

            // Contador: Solo lectura de reportes, créditos y ventas
            ["Contador"] = GetPermIds(
                "ViewBatches",
                "ViewProduction",
                "ViewSales",
                "ViewSupplies",
                "ViewCustomers",
                "ViewCredits",
                "ViewReports",
                "ViewDashboard"
            )
        };

        // Crear o actualizar cada rol
        foreach (var (roleName, permIds) in roleDefs)
        {
            var role = await db.Roles.Find(r => r.Name == roleName).FirstOrDefaultAsync();

            if (role is null)
            {
                role = new Role
                {
                    Id = Guid.NewGuid(),
                    Name = roleName,
                    PermissionIds = permIds.Distinct().ToList()
                };
                await db.Roles.InsertOneAsync(role);
            }
            else
            {
                role.PermissionIds = permIds.Distinct().ToList();
                await db.Roles.ReplaceOneAsync(r => r.Id == role.Id, role);
            }
        }

        // Obtener el rol Admin para el usuario admin
        var adminRole = await db.Roles.Find(r => r.Name == "Admin").FirstOrDefaultAsync();

        // Ensure at least one admin user exists
        var adminUser = await db.Users.Find(u => u.UserName == "admin").FirstOrDefaultAsync();
        if (adminUser is null)
        {
            adminUser = new User
            {
                Id = Guid.NewGuid(),
                UserName = "admin",
                IsActive = true,
                RoleIds = new List<Guid> { adminRole!.Id }
            };

            adminUser.PasswordHash = hasher.HashPassword(adminUser, "Admin123*");
            await db.Users.InsertOneAsync(adminUser);
        }
        else
        {
            if (!adminUser.RoleIds.Contains(adminRole!.Id))
            {
                adminUser.RoleIds.Add(adminRole.Id);
                await db.Users.ReplaceOneAsync(u => u.Id == adminUser.Id, adminUser);
            }
        }
    }
}