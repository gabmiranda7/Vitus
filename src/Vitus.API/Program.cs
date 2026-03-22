using Microsoft.EntityFrameworkCore;
using Vitus.Infrastructure.Data;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? builder.Configuration["DB_USER"];
var dbPass = Environment.GetEnvironmentVariable("DB_PASS") ?? builder.Configuration["DB_PASS"];

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    .Replace("{DB_USER}", dbUser)
    .Replace("{DB_PASS}", dbPass);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();