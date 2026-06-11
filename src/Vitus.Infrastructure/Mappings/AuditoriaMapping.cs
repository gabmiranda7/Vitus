using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vitus.Domain.Entities;

namespace Vitus.Infrastructure.Mappings
{
    public class AuditoriaMapping : IEntityTypeConfiguration<AuditoriaLog>
    {
        public void Configure(EntityTypeBuilder<AuditoriaLog> builder)
        {
            builder.ToTable("auditorias");

            builder.HasKey(a => a.Id);

            builder.Property(a => a.UsuarioNome)
                   .IsRequired()
                   .HasMaxLength(200);

            builder.Property(a => a.Acao)
                   .HasConversion<string>()
                   .IsRequired();

            builder.Property(a => a.EntidadeAfetada)
                   .IsRequired()
                   .HasMaxLength(100);

            builder.Property(a => a.DataHora)
                   .IsRequired();

            builder.Property(a => a.Detalhes)
                   .HasMaxLength(500);
        }
    }
}