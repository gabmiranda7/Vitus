using Microsoft.EntityFrameworkCore;
using Vitus.Domain.Entities;

namespace Vitus.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public DbSet<Paciente> Pacientes { get; set; }
        public DbSet<Medico> Medicos { get; set; }
        public DbSet<Prontuario> Prontuarios { get; set; }
        public DbSet<Consulta> Consultas { get; set; }
        public DbSet<Triagem> Triagens { get; set; }
        public DbSet<Receita> Receitas { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        }
    }
}