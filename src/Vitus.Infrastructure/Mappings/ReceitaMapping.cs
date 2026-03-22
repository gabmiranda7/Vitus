using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vitus.Domain.Entities;

namespace Vitus.Infrastructure.Mappings
{
    public class ReceitaMapping : IEntityTypeConfiguration<Receita>
    {
        public void Configure(EntityTypeBuilder<Receita> builder)
        {
            builder.ToTable("receitas");

            builder.HasKey(r => r.Id);

            builder.HasOne<Consulta>()
                   .WithMany()
                   .HasForeignKey(r => r.ConsultaId);

            builder.OwnsMany(r => r.Medicamentos, m =>
            {
                m.ToTable("medicamentos");

                m.WithOwner().HasForeignKey("ReceitaId");

                m.Property<Guid>("Id");
                m.HasKey("Id");

                m.Property(p => p.Nome).IsRequired().HasMaxLength(200);
                m.Property(p => p.Dosagem).HasMaxLength(50);
                m.Property(p => p.Posologia).HasMaxLength(300);
            });
        }
    }
}