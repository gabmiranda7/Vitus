using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vitus.Domain.Entities;

namespace Vitus.Infrastructure.Mappings
{
    public class MedicoMapping : IEntityTypeConfiguration<Medico>
    {
        public void Configure(EntityTypeBuilder<Medico> builder)
        {
            builder.ToTable("medicos");

            builder.HasKey(m => m.Id);

            builder.Property(m => m.Nome)
                   .IsRequired()
                   .HasMaxLength(200);

            builder.Property(m => m.Especialidade)
                   .IsRequired()
                   .HasMaxLength(100);
        }
    }
}