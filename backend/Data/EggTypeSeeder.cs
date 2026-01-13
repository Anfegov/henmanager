using HenManager.Api.Domain;
using MongoDB.Driver;

namespace HenManager.Api.Data;

public static class EggTypeSeeder
{
    public static async Task SeedAsync(MongoDbContext db)
    {
        // Tipos de huevo por defecto (basados en el enum original)
        var defaultTypes = new List<EggTypeEntity>
        {
            new() { Id = Guid.NewGuid(), Name = "Pequeno", Description = "Huevo pequeno", DisplayOrder = 1 },
            new() { Id = Guid.NewGuid(), Name = "Mediano", Description = "Huevo mediano", DisplayOrder = 2 },
            new() { Id = Guid.NewGuid(), Name = "Grande", Description = "Huevo grande", DisplayOrder = 3 },
            new() { Id = Guid.NewGuid(), Name = "Extra Grande", Description = "Huevo extra grande", DisplayOrder = 4 },
            new() { Id = Guid.NewGuid(), Name = "Doble Yema", Description = "Huevo con doble yema", DisplayOrder = 5 },
            new() { Id = Guid.NewGuid(), Name = "Roto", Description = "Huevo roto o danado", DisplayOrder = 6 },
        };

        // Solo insertar si la coleccion esta vacia
        var count = await db.EggTypes.CountDocumentsAsync(_ => true);
        if (count == 0)
        {
            await db.EggTypes.InsertManyAsync(defaultTypes);
        }
    }
}
