using HenManager.Api.Domain;
using MongoDB.Driver;

namespace HenManager.Api.Data;

public static class PermissionSeeder
{
    public static async Task SeedAsync(MongoDbContext db)
    {
        // Permisos con patron CRUD por modulo
        var basePerms = new List<PermissionEntity>
        {
            // === CAMADAS ===
            new() { Id = Guid.NewGuid(), Code = "ViewBatches", Name = "Ver camadas" },
            new() { Id = Guid.NewGuid(), Code = "CreateBatch", Name = "Crear camada" },
            new() { Id = Guid.NewGuid(), Code = "EditBatch", Name = "Editar camada" },
            new() { Id = Guid.NewGuid(), Code = "CloseBatch", Name = "Cerrar camada" },

            // === PRODUCCION ===
            new() { Id = Guid.NewGuid(), Code = "ViewProduction", Name = "Ver produccion" },
            new() { Id = Guid.NewGuid(), Code = "CreateProduction", Name = "Registrar produccion" },
            new() { Id = Guid.NewGuid(), Code = "EditProduction", Name = "Editar produccion" },
            new() { Id = Guid.NewGuid(), Code = "DeleteProduction", Name = "Eliminar produccion" },

            // === VENTAS ===
            new() { Id = Guid.NewGuid(), Code = "ViewSales", Name = "Ver ventas" },
            new() { Id = Guid.NewGuid(), Code = "CreateSale", Name = "Registrar venta" },
            new() { Id = Guid.NewGuid(), Code = "EditSale", Name = "Editar venta" },
            new() { Id = Guid.NewGuid(), Code = "DeleteSale", Name = "Eliminar venta" },

            // === INSUMOS ===
            new() { Id = Guid.NewGuid(), Code = "ViewSupplies", Name = "Ver insumos" },
            new() { Id = Guid.NewGuid(), Code = "CreateSupply", Name = "Registrar insumo" },
            new() { Id = Guid.NewGuid(), Code = "EditSupply", Name = "Editar insumo" },
            new() { Id = Guid.NewGuid(), Code = "DeleteSupply", Name = "Eliminar insumo" },

            // === CLIENTES ===
            new() { Id = Guid.NewGuid(), Code = "ViewCustomers", Name = "Ver clientes" },
            new() { Id = Guid.NewGuid(), Code = "CreateCustomer", Name = "Crear cliente" },
            new() { Id = Guid.NewGuid(), Code = "EditCustomer", Name = "Editar cliente" },
            new() { Id = Guid.NewGuid(), Code = "DeleteCustomer", Name = "Eliminar cliente" },

            // === CREDITOS ===
            new() { Id = Guid.NewGuid(), Code = "ViewCredits", Name = "Ver creditos/cartera" },
            new() { Id = Guid.NewGuid(), Code = "RegisterPayment", Name = "Registrar abono" },
            new() { Id = Guid.NewGuid(), Code = "CancelCredit", Name = "Cancelar credito" },

            // === REPORTES ===
            new() { Id = Guid.NewGuid(), Code = "ViewReports", Name = "Ver reportes" },

            // === TIPOS DE HUEVO ===
            new() { Id = Guid.NewGuid(), Code = "ViewEggTypes", Name = "Ver tipos de huevo" },
            new() { Id = Guid.NewGuid(), Code = "CreateEggType", Name = "Crear tipo de huevo" },
            new() { Id = Guid.NewGuid(), Code = "EditEggType", Name = "Editar tipo de huevo" },
            new() { Id = Guid.NewGuid(), Code = "DeleteEggType", Name = "Eliminar tipo de huevo" },

            // === USUARIOS ===
            new() { Id = Guid.NewGuid(), Code = "ViewUsers", Name = "Ver usuarios" },
            new() { Id = Guid.NewGuid(), Code = "CreateUser", Name = "Crear usuario" },
            new() { Id = Guid.NewGuid(), Code = "EditUser", Name = "Editar usuario" },
            new() { Id = Guid.NewGuid(), Code = "DeleteUser", Name = "Eliminar usuario" },

            // === ROLES ===
            new() { Id = Guid.NewGuid(), Code = "ViewRoles", Name = "Ver roles" },
            new() { Id = Guid.NewGuid(), Code = "CreateRole", Name = "Crear rol" },
            new() { Id = Guid.NewGuid(), Code = "EditRole", Name = "Editar rol" },
            new() { Id = Guid.NewGuid(), Code = "DeleteRole", Name = "Eliminar rol" },

            // === DASHBOARD ===
            new() { Id = Guid.NewGuid(), Code = "ViewDashboard", Name = "Ver dashboard" },
        };

        // Insertar solo los que no existan (NO borra ni modifica los existentes)
        var existingCodes = await db.Permissions
            .Find(_ => true)
            .Project(p => p.Code)
            .ToListAsync();

        var toInsert = basePerms
            .Where(p => !existingCodes.Contains(p.Code))
            .ToList();

        if (toInsert.Count > 0)
            await db.Permissions.InsertManyAsync(toInsert);
    }
}
