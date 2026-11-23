using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vitus.Domain.Entities;
using Vitus.Infrastructure.Security;

namespace Vitus.Infrastructure.Mappings
{
    public class TriagemMapping : IEntityTypeConfiguration<Triagem>
    {
        public void Configure(EntityTypeBuilder<Triagem> builder)
        {
            builder.ToTable("triagens");

            builder.HasKey(t => t.Id);

            builder.Property(t => t.Observacoes)
                   .HasMaxLength(1000)
                   .HasConversion(new AesEncryptionConverter());

            builder.Property(t => t.ConsultaId)
                .IsRequired();

            builder.HasIndex(t => t.ConsultaId)
                   .IsUnique()
                   .HasFilter("consulta_id <> '00000000-0000-0000-0000-000000000000'");

            builder.Property(t => t.PressaoArterial)
                   .HasMaxLength(20);

            builder.Property(t => t.Temperatura)
                   .IsRequired();

            builder.Property(t => t.Glicemia);

            builder.Property(t => t.NomeEnfermeiro)
                    .IsRequired()
                    .HasMaxLength(200);
        }
    }
}