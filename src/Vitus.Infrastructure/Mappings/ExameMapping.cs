using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vitus.Domain.Entities;

namespace Vitus.Infrastructure.Mappings
{
    public class ExameMapping : IEntityTypeConfiguration<Exame>
    {
        public void Configure(EntityTypeBuilder<Exame> builder)
        {
            builder.ToTable("exames");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.Categoria)
                   .HasConversion<string>()
                   .IsRequired();

            builder.Property(e => e.Nome)
                   .IsRequired()
                   .HasMaxLength(200);

            builder.Property(e => e.Descricao)
                   .HasMaxLength(500);

            builder.Property(e => e.MedicoSolicitante)
                   .IsRequired()
                   .HasMaxLength(200);

            builder.Property(e => e.DataExame)
                   .IsRequired();

            builder.Property(e => e.Observacoes)
                   .HasMaxLength(2000);

            builder.Property(e => e.CaminhoArquivo)
                   .HasMaxLength(500);

            builder.Property(e => e.NomeArquivoOriginal)
                   .HasMaxLength(300);

            builder.HasOne(e => e.Prontuario)
                   .WithMany()
                   .HasForeignKey(e => e.ProntuarioId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}