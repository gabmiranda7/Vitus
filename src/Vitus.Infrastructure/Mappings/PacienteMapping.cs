using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vitus.Domain.Entities;

namespace Vitus.Infrastructure.Mappings
{
    public class PacienteMapping : IEntityTypeConfiguration<Paciente>
    {
        public void Configure(EntityTypeBuilder<Paciente> builder)
        {
            builder.ToTable("pacientes");

            builder.HasKey(p => p.Id);

            builder.Property(p => p.Nome)
                   .IsRequired()
                   .HasMaxLength(200);

            builder.HasOne(p => p.Prontuario)
                   .WithOne()
                   .HasForeignKey<Prontuario>(p => p.PacienteId);
        }
    }
}