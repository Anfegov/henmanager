using System.Text;
using System.Text.Json.Serialization;
using HenManager.Api.Data;
using HenManager.Api.Domain;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

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
    options.AddPolicy("RegisterSale", p => p.RequireClaim("permission", "RegisterSale"));
    options.AddPolicy("ViewSales", p => p.RequireClaim("permission", "ViewSales"));
    options.AddPolicy("RegisterPayment", p => p.RequireClaim("permission", "RegisterPayment"));
    options.AddPolicy("CancelCredit", p => p.RequireClaim("permission", "CancelCredit"));
    options.AddPolicy("ViewBatch", p => p.RequireClaim("permission", "ViewBatch"));
    options.AddPolicy("CreateBatch", p => p.RequireClaim("permission", "CreateBatch"));
    options.AddPolicy("CloseBatch", p => p.RequireClaim("permission", "CloseBatch"));
    options.AddPolicy("RegisterDailyProduction", p => p.RequireClaim("permission", "RegisterDailyProduction"));
    options.AddPolicy("ViewProduction", p => p.RequireClaim("permission", "ViewProduction"));
    options.AddPolicy("RegisterSupply", p => p.RequireClaim("permission", "RegisterSupply"));
    options.AddPolicy("ViewSupplies", p => p.RequireClaim("permission", "ViewSupplies"));
    options.AddPolicy("ViewReports", p => p.RequireClaim("permission", "ViewReports"));
    options.AddPolicy("ManageUsers", p => p.RequireClaim("permission", "ManageUsers"));
    options.AddPolicy("ManageRoles", p => p.RequireClaim("permission", "ManageRoles"));
    options.AddPolicy("ManageCustomers", p => p.RequireClaim("permission", "ManageCustomers"));
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