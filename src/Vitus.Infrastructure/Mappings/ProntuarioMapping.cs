using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vitus.Domain.Entities;

namespace Vitus.Infrastructure.Mappings
{
    public class ProntuarioMapping : IEntityTypeConfiguration<Prontuario>
    {
        public void Configure(EntityTypeBuilder<Prontuario> builder)
        {
            builder.ToTable("prontuarios");

            builder.HasKey(p => p.Id);

            builder.Property(p => p.PacienteId)
                   .IsRequired();

            builder.HasMany(p => p.Triagens)
                   .WithOne(t => t.Prontuario)
                   .HasForeignKey(t => t.ProntuarioId);

            builder.Navigation(p => p.Triagens)
                   .UsePropertyAccessMode(PropertyAccessMode.Field);

            builder.HasMany(p => p.Consultas)
                   .WithOne()
                   .HasForeignKey(c => c.ProntuarioId);

            builder.Navigation(p => p.Consultas)
                   .UsePropertyAccessMode(PropertyAccessMode.Field);

            builder.HasMany(p => p.Receitas)
                   .WithOne(); 

            builder.Navigation(p => p.Receitas)
                   .UsePropertyAccessMode(PropertyAccessMode.Field);
        }
    }
}