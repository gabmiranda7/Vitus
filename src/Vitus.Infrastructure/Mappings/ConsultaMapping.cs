using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vitus.Domain.Entities;

namespace Vitus.Infrastructure.Mappings
{
    public class ConsultaMapping : IEntityTypeConfiguration<Consulta>
    {
        public void Configure(EntityTypeBuilder<Consulta> builder)
        {
            builder.ToTable("consultas");

            builder.HasKey(c => c.Id);

            builder.Property(c => c.DataConsulta)
                   .IsRequired();

            builder.Property(c => c.Status)
                   .HasConversion<string>()
                   .IsRequired();

            builder.Property(c => c.Anotacoes)
                .HasMaxLength(2000);

            builder.HasOne<Prontuario>()
                   .WithMany()
                   .HasForeignKey(c => c.ProntuarioId);

            builder.HasOne<Paciente>()
                   .WithMany()
                   .HasForeignKey(c => c.PacienteId);

            builder.HasOne<Medico>()
                   .WithMany()
                   .HasForeignKey(c => c.MedicoId);
        }
    }
}