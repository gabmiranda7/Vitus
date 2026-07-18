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
            builder.Property(e => e.Especializacao).IsRequired().HasMaxLength(200);
        }
    }
}