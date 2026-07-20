using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Vitus.Domain.Interfaces;
using Vitus.Infrastructure.Data;
using Vitus.Infrastructure.Repositories;
using Vitus.Infrastructure.Services;

namespace Vitus.API.Extensions
{
    public static class InfrastructureServicesExtensions
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
        {
            var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") ?? configuration["JWT_KEY"];
            var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? configuration["DB_USER"];
            var dbPass = Environment.GetEnvironmentVariable("DB_PASS") ?? configuration["DB_PASS"];

            var connectionString = configuration.GetConnectionString("DefaultConnection")!
                .Replace("{DB_USER}", dbUser)
                .Replace("{DB_PASS}", dbPass);

            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(connectionString, npgsqlOptions =>
                    npgsqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery))
                    .UseSnakeCaseNamingConvention());

            services.AddHttpContextAccessor();

            services.AddScoped<IArquivoService, ArquivoService>();
            services.AddScoped<IAuditoriaRepository, AuditoriaRepository>();
            services.AddScoped<IConsultaRepository, ConsultaRepository>();
            services.AddScoped<IDocumentoService, DocumentoService>();
            services.AddScoped<IEnfermeiroRepository, EnfermeiroRepository>();
            services.AddScoped<IExameRepository, ExameRepository>();
            services.AddScoped<IMedicoRepository, MedicoRepository>();
            services.AddScoped<IPacienteRepository, PacienteRepository>();
            services.AddScoped<IProntuarioRepository, ProntuarioRepository>();
            services.AddScoped<IReceitaRepository, ReceitaRepository>();
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<ITriagemRepository, TriagemRepository>();
            services.AddScoped<IUsuarioContexto, UsuarioContexto>();
            services.AddScoped<IUsuarioRepository, UsuarioRepository>();

            return services;
        }
    }
}