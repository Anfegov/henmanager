using HenManager.Api.Domain;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace HenManager.Api.Data;

public class MongoSettings
{
    public string ConnectionString { get; set; } = default!;
    public string Database { get; set; } = default!;
}

public interface IMongoDbContext
{
    IMongoCollection<User> Users { get; }
    IMongoCollection<Role> Roles { get; }
    IMongoCollection<PermissionEntity> Permissions { get; }
    IMongoCollection<HenBatch> HenBatches { get; }
    IMongoCollection<EggProduction> EggProductions { get; }
    IMongoCollection<Sale> Sales { get; }
    IMongoCollection<Payment> Payments { get; }
    IMongoCollection<Supply> Supplies { get; }
    IMongoCollection<Customer> Customers { get; }
}

public class MongoDbContext : IMongoDbContext
{
    private readonly IMongoDatabase _db;

    public MongoDbContext(IOptions<MongoSettings> options)
    {
        var client = new MongoClient(options.Value.ConnectionString);
        _db = client.GetDatabase(options.Value.Database);
    }

    public IMongoCollection<User> Users => _db.GetCollection<User>("Users");
    public IMongoCollection<Role> Roles => _db.GetCollection<Role>("Roles");
    public IMongoCollection<PermissionEntity> Permissions => _db.GetCollection<PermissionEntity>("permissions");
    public IMongoCollection<HenBatch> HenBatches => _db.GetCollection<HenBatch>("HenBatches");
    public IMongoCollection<EggProduction> EggProductions => _db.GetCollection<EggProduction>("EggProductions");
    public IMongoCollection<Sale> Sales => _db.GetCollection<Sale>("Sales");
    public IMongoCollection<Payment> Payments => _db.GetCollection<Payment>("Payments");
    public IMongoCollection<Supply> Supplies => _db.GetCollection<Supply>("Supplies");
    public IMongoCollection<Customer> Customers => _db.GetCollection<Customer>("Customers");
}