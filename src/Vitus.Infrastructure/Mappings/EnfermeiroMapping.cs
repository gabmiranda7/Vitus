using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vitus.Domain.Entities;

namespace Vitus.Infrastructure.Mappings
{
    public class EnfermeiroMapping : IEntityTypeConfiguration<Enfermeiro>
    {
        public void Configure(EntityTypeBuilder<Enfermeiro> builder)
        {
            builder.ToTable("enfermeiro");
            builder.HasKey(e => e.Id);
            builder.Property(e => e.Nome).IsRequired().HasMaxLength(200);
            builder.Property(e => e.COREN).IsRequired().HasMaxLength(50);
            builder.Property(e => e.Especializacao).HasMaxLength(200);

            builder.HasIndex(e => e.UsuarioId).IsUnique();

            builder.HasOne<Usuario>()
                   .WithMany()
                   .HasForeignKey(e => e.UsuarioId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}