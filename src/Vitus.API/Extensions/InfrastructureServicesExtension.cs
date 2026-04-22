using Microsoft.EntityFrameworkCore;
using Vitus.Domain.Interfaces;
using Vitus.Infrastructure.Data;
using Vitus.Infrastructure.Repositories;

namespace Vitus.API.Extensions
{
    public static class InfrastructureServicesExtensions
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
        {
            var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? configuration["DB_USER"];
            var dbPass = Environment.GetEnvironmentVariable("DB_PASS") ?? configuration["DB_PASS"];

            var connectionString = configuration.GetConnectionString("DefaultConnection")!
                .Replace("{DB_USER}", dbUser)
                .Replace("{DB_PASS}", dbPass);

            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(connectionString));

            services.AddScoped<IConsultaRepository, ConsultaRepository>();
            services.AddScoped<IMedicoRepository, MedicoRepository>();
            services.AddScoped<IPacienteRepository, PacienteRepository>();
            services.AddScoped<IReceitaRepository, ReceitaRepository>();
            services.AddScoped<ITriagemRepository, TriagemRepository>();

            return services;
        }
    }
}