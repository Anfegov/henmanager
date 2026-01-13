using System.Text;
using System.Text.Json.Serialization;
using HenManager.Api.Data;
using HenManager.Api.Domain;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;

var builder = WebApplication.CreateBuilder(args);

BsonDefaults.GuidRepresentation = GuidRepresentation.Standard;
BsonSerializer.RegisterSerializer(new GuidSerializer(GuidRepresentation.Standard));

builder.Services
    .AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


builder.Services.Configure<MongoSettings>(builder.Configuration.GetSection("Mongo"));
builder.Services.AddSingleton<IMongoDbContext, MongoDbContext>();
builder.Services.AddSingleton<MongoDbContext>();

builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

var jwtKey = builder.Configuration["Jwt:Key"]!;
var issuer = builder.Configuration["Jwt:Issuer"];
var audience = builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication(o =>
{
    o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    o.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(o =>
{
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = !string.IsNullOrWhiteSpace(issuer),
        ValidIssuer = issuer,
        ValidateAudience = !string.IsNullOrWhiteSpace(audience),
        ValidAudience = audience,
        ValidateLifetime = true
    };
});

builder.Services.AddAuthorization(options =>
{
    // === CAMADAS ===
    options.AddPolicy("ViewBatches", p => p.RequireClaim("permission", "ViewBatches"));
    options.AddPolicy("CreateBatch", p => p.RequireClaim("permission", "CreateBatch"));
    options.AddPolicy("EditBatch", p => p.RequireClaim("permission", "EditBatch"));
    options.AddPolicy("CloseBatch", p => p.RequireClaim("permission", "CloseBatch"));

    // === PRODUCCION ===
    options.AddPolicy("ViewProduction", p => p.RequireClaim("permission", "ViewProduction"));
    options.AddPolicy("CreateProduction", p => p.RequireClaim("permission", "CreateProduction"));
    options.AddPolicy("EditProduction", p => p.RequireClaim("permission", "EditProduction"));
    options.AddPolicy("DeleteProduction", p => p.RequireClaim("permission", "DeleteProduction"));

    // === VENTAS ===
    options.AddPolicy("ViewSales", p => p.RequireClaim("permission", "ViewSales"));
    options.AddPolicy("CreateSale", p => p.RequireClaim("permission", "CreateSale"));
    options.AddPolicy("EditSale", p => p.RequireClaim("permission", "EditSale"));
    options.AddPolicy("DeleteSale", p => p.RequireClaim("permission", "DeleteSale"));

    // === INSUMOS ===
    options.AddPolicy("ViewSupplies", p => p.RequireClaim("permission", "ViewSupplies"));
    options.AddPolicy("CreateSupply", p => p.RequireClaim("permission", "CreateSupply"));
    options.AddPolicy("EditSupply", p => p.RequireClaim("permission", "EditSupply"));
    options.AddPolicy("DeleteSupply", p => p.RequireClaim("permission", "DeleteSupply"));

    // === CLIENTES ===
    options.AddPolicy("ViewCustomers", p => p.RequireClaim("permission", "ViewCustomers"));
    options.AddPolicy("CreateCustomer", p => p.RequireClaim("permission", "CreateCustomer"));
    options.AddPolicy("EditCustomer", p => p.RequireClaim("permission", "EditCustomer"));
    options.AddPolicy("DeleteCustomer", p => p.RequireClaim("permission", "DeleteCustomer"));

    // === CREDITOS ===
    options.AddPolicy("ViewCredits", p => p.RequireClaim("permission", "ViewCredits"));
    options.AddPolicy("RegisterPayment", p => p.RequireClaim("permission", "RegisterPayment"));
    options.AddPolicy("CancelCredit", p => p.RequireClaim("permission", "CancelCredit"));

    // === REPORTES ===
    options.AddPolicy("ViewReports", p => p.RequireClaim("permission", "ViewReports"));

    // === TIPOS DE HUEVO ===
    options.AddPolicy("ViewEggTypes", p => p.RequireClaim("permission", "ViewEggTypes"));
    options.AddPolicy("CreateEggType", p => p.RequireClaim("permission", "CreateEggType"));
    options.AddPolicy("EditEggType", p => p.RequireClaim("permission", "EditEggType"));
    options.AddPolicy("DeleteEggType", p => p.RequireClaim("permission", "DeleteEggType"));

    // === USUARIOS ===
    options.AddPolicy("ViewUsers", p => p.RequireClaim("permission", "ViewUsers"));
    options.AddPolicy("CreateUser", p => p.RequireClaim("permission", "CreateUser"));
    options.AddPolicy("EditUser", p => p.RequireClaim("permission", "EditUser"));
    options.AddPolicy("DeleteUser", p => p.RequireClaim("permission", "DeleteUser"));

    // === ROLES ===
    options.AddPolicy("ViewRoles", p => p.RequireClaim("permission", "ViewRoles"));
    options.AddPolicy("CreateRole", p => p.RequireClaim("permission", "CreateRole"));
    options.AddPolicy("EditRole", p => p.RequireClaim("permission", "EditRole"));
    options.AddPolicy("DeleteRole", p => p.RequireClaim("permission", "DeleteRole"));

    // === DASHBOARD ===
    options.AddPolicy("ViewDashboard", p => p.RequireClaim("permission", "ViewDashboard"));
});

builder.Services.AddCors(opt =>
{
    opt.AddDefaultPolicy(p => p.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MongoDbContext>();
    await PermissionSeeder.SeedAsync(db);
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
    await UserRoleSeeder.SeedAsync(db, hasher);
    await EggTypeSeeder.SeedAsync(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();