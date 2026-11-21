using FluentAssertions;
using Vitus.Domain.Exceptions;
using Vitus.Domain.ValueObjects;

namespace Vitus.Tests.Domain
{
    public class CpfBrasileiroTests
    {
        [Theory]
        [InlineData("529.982.247-25")]
        [InlineData("52998224725")]
        [InlineData("111.444.777-35")]
        public void EhValido_CpfCorreto(string cpf)
        {
            CpfBrasileiro.EhValido(cpf).Should().BeTrue();
        }

        [Theory]
        [InlineData("123.456.789-00")]
        [InlineData("111.111.111-11")]
        [InlineData("123")]
        [InlineData("abc")]
        public void EhValido_CpfIncorreto(string cpf)
        {
            CpfBrasileiro.EhValido(cpf).Should().BeFalse();
        }

        [Fact]
        public void Normalizar_DigitosPuros_FormataNoPadrao()
        {
            CpfBrasileiro.Normalizar("52998224725").Should().Be("529.982.247-25");
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData(null)]
        public void Normalizar_Vazio_RetornaNulo(string? cpf)
        {
            CpfBrasileiro.Normalizar(cpf).Should().BeNull();
        }

        [Fact]
        public void Normalizar_Invalido_Lanca()
        {
            var act = () => CpfBrasileiro.Normalizar("123.456.789-00");

            act.Should().Throw<DomainException>().WithMessage("CPF inválido");
        }
    }
}