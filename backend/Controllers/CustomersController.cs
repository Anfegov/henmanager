using HenManager.Api.Data;
using HenManager.Api.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace HenManager.Api.Controllers;

[ApiController]
[Route("api/customers")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly MongoDbContext _db;
    public CustomersController(MongoDbContext db) => _db = db;

    [HttpGet]
    [Authorize(Policy = "ViewCustomers")]
    public async Task<ActionResult<List<Customer>>> GetAll([FromQuery] bool activeOnly = false, [FromQuery] string? search = null)
    {
        var filter = Builders<Customer>.Filter.Empty;

        if (activeOnly)
            filter &= Builders<Customer>.Filter.Eq(c => c.IsActive, true);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            filter &= Builders<Customer>.Filter.Or(
                Builders<Customer>.Filter.Regex(c => c.Name, new MongoDB.Bson.BsonRegularExpression(s, "i")),
                Builders<Customer>.Filter.Regex(c => c.Phone, new MongoDB.Bson.BsonRegularExpression(s, "i")),
                Builders<Customer>.Filter.Regex(c => c.Email, new MongoDB.Bson.BsonRegularExpression(s, "i"))
            );
        }

        var customers = await _db.Customers.Find(filter).SortByDescending(c => c.Name).ToListAsync();
        return Ok(customers);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "ViewCustomers")]
    public async Task<ActionResult<Customer>> GetById(Guid id)
    {
        var customer = await _db.Customers.Find(c => c.Id == id).FirstOrDefaultAsync();
        if (customer is null) return NotFound();
        return Ok(customer);
    }

    [HttpPost]
    [Authorize(Policy = "CreateCustomer")]
    public async Task<ActionResult<Customer>> Create(Customer request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("El nombre es obligatorio.");

        request.Id = Guid.NewGuid();
        request.Name = request.Name.Trim();
        request.Phone = request.Phone?.Trim();
        request.Email = request.Email?.Trim();
        request.Address = request.Address?.Trim();
        request.IsActive = request.IsActive;

        await _db.Customers.InsertOneAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = request.Id }, request);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "EditCustomer")]
    public async Task<ActionResult<Customer>> Update(Guid id, Customer request)
    {
        var customer = await _db.Customers.Find(c => c.Id == id).FirstOrDefaultAsync();
        if (customer is null) return NotFound();

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("El nombre es obligatorio.");

        customer.Name = request.Name.Trim();
        customer.Phone = request.Phone?.Trim();
        customer.Email = request.Email?.Trim();
        customer.Address = request.Address?.Trim();
        customer.IsActive = request.IsActive;

        await _db.Customers.ReplaceOneAsync(c => c.Id == id, customer);
        return Ok(customer);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "DeleteCustomer")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _db.Customers.DeleteOneAsync(c => c.Id == id);
        if (result.DeletedCount == 0) return NotFound();
        return NoContent();
    }
}
