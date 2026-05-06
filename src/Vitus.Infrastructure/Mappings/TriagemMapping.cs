using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vitus.Domain.Entities;

namespace Vitus.Infrastructure.Mappings
{
    public class TriagemMapping : IEntityTypeConfiguration<Triagem>
    {
        public void Configure(EntityTypeBuilder<Triagem> builder)
        {
            builder.ToTable("triagens");

            builder.HasKey(t => t.Id);

            builder.Property(t => t.Observacoes)
                   .HasMaxLength(500);

            builder.Property(t => t.PressaoArterial)
                   .HasMaxLength(20);

            builder.Property(t => t.Temperatura)
                   .IsRequired();

            builder.Property(t => t.NomeEnfermeiro)
                    .IsRequired()
                    .HasMaxLength(200);
        }
    }
}