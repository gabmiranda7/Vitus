using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Vitus.Application.UseCases.Consultas.CreateConsulta;
using Vitus.Application.UseCases.Medicos.CreateMedico;
using Vitus.Application.UseCases.Medicos.GetAllMedicos;
using Vitus.Application.UseCases.Medicos.GetMedicoById;
using Vitus.Application.UseCases.Pacientes.CreatePaciente;
using Vitus.Application.UseCases.Pacientes.DeletePaciente;
using Vitus.Application.UseCases.Pacientes.GetAllPacientes;
using Vitus.Application.UseCases.Pacientes.GetPacienteById;
using Vitus.Application.UseCases.Pacientes.UpdatePaciente;
using Vitus.Domain.Interfaces;
using Vitus.Infrastructure.Data;
using Vitus.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? builder.Configuration["DB_USER"];
var dbPass = Environment.GetEnvironmentVariable("DB_PASS") ?? builder.Configuration["DB_PASS"];

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    .Replace("{DB_USER}", dbUser)
    .Replace("{DB_PASS}", dbPass);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<CreateConsultaUseCase>();
builder.Services.AddScoped<CreatePacienteUseCase>();

builder.Services.AddScoped<CreateMedicoUseCase>();
builder.Services.AddScoped<GetMedicoByIdUseCase>();
builder.Services.AddScoped<GetAllMedicosUseCase>();

builder.Services.AddScoped<UpdatePacienteUseCase>();
builder.Services.AddScoped<DeletePacienteUseCase>();
builder.Services.AddScoped<GetPacienteByIdUseCase>();
builder.Services.AddScoped<GetAllPacientesUseCase>();

builder.Services.AddScoped<IConsultaRepository, ConsultaRepository>();
builder.Services.AddScoped<IMedicoRepository, MedicoRepository>();
builder.Services.AddScoped<IPacienteRepository, PacienteRepository>();

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