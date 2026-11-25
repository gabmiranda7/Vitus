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

            builder.Property(p => p.Ativo)
                   .HasDefaultValue(true);
            
            builder.HasIndex(p => p.Cpf)
                .IsUnique();

            builder.HasOne(p => p.Prontuario)
                   .WithOne()
                   .HasForeignKey<Prontuario>(p => p.PacienteId);
        }
    }
}