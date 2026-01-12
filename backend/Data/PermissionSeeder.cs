using HenManager.Api.Domain;
using MongoDB.Driver;

namespace HenManager.Api.Data;

public static class PermissionSeeder
{
    public static async Task SeedAsync(MongoDbContext db)
    {
        // Permisos esperados por el sistema
        var basePerms = new List<PermissionEntity>
        {
            new() { Id = Guid.NewGuid(), Code="CreateBatch", Name="Crear camada" },
            new() { Id = Guid.NewGuid(), Code="ViewBatch", Name="Ver camadas" },
            new() { Id = Guid.NewGuid(), Code="CloseBatch", Name="Cerrar camada" },

            new() { Id = Guid.NewGuid(), Code="RegisterDailyProduction", Name="Registrar producción diaria" },
            new() { Id = Guid.NewGuid(), Code="ViewProduction", Name="Ver producción" },

            new() { Id = Guid.NewGuid(), Code="RegisterSale", Name="Registrar venta" },
            new() { Id = Guid.NewGuid(), Code="ViewSales", Name="Ver ventas" },

            new() { Id = Guid.NewGuid(), Code="CancelCredit", Name="Cancelar crédito" },
            new() { Id = Guid.NewGuid(), Code="RegisterPayment", Name="Registrar pago" },

            new() { Id = Guid.NewGuid(), Code="RegisterSupply", Name="Registrar insumo" },
            new() { Id = Guid.NewGuid(), Code="ViewSupplies", Name="Ver insumos" },

            new() { Id = Guid.NewGuid(), Code="ViewReports", Name="Ver reportes" },

            new() { Id = Guid.NewGuid(), Code="ManageUsers", Name="Administrar usuarios" },
            new() { Id = Guid.NewGuid(), Code="ManageRoles", Name="Administrar roles" },
            new() { Id = Guid.NewGuid(), Code="ManageCustomers", Name="Administrar clientes" },
            new() { Id = Guid.NewGuid(), Code="ViewCustomers", Name="Ver clientes" },
            new() { Id = Guid.NewGuid(), Code="ManageEggTypes", Name="Administrar tipos de huevo" },
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
