using FluentAssertions;
using Vitus.Application.UseCases.Exames.AnalisarExameIa;

namespace Vitus.Tests.Application
{
    public class AnonimizadorDeTextoTests
    {
        private static readonly IdentificadoresPaciente Paciente = new(
            "João da Silva", "Maria Souza", "Pedro Silva", "Rua das Flores, 123, Centro", new DateOnly(1990, 5, 15));

        [Fact]
        public void Cpf_ComEMascara_Sai()
        {
            var r = AnonimizadorDeTexto.Anonimizar("CPF 529.982.247-25 e 52998224725", null);

            r.Should().NotContain("529").And.NotContain("52998224725");
            r.Should().Contain(AnonimizadorDeTexto.Marcador);
        }

        [Fact]
        public void NomeDoPaciente_SemAcentoEEmMinusculas_Sai()
        {
            var r = AnonimizadorDeTexto.Anonimizar("Amostra de joao DA silva colhida hoje", Paciente);

            r.Should().NotContain("joao").And.NotContain("silva");
            r.Should().Contain("Amostra de").And.Contain("colhida hoje");
        }

        [Fact]
        public void LinhaRotulada_ApagaOValorEMantemOutrasLinhas()
        {
            var texto = "Nome da mãe: Fulana de Tal\nHemoglobina: 13,5 g/dL";

            var r = AnonimizadorDeTexto.Anonimizar(texto, null);

            r.Should().NotContain("Fulana");
            r.Should().Contain("Hemoglobina: 13,5 g/dL");
        }

        [Fact]
        public void NomeDosPais_Sai()
        {
            var r = AnonimizadorDeTexto.Anonimizar("Responsável legal: maria souza, filha de pedro", Paciente);

            r.Should().NotContain("souza").And.NotContain("maria");
        }

        [Fact]
        public void TrechosDoEndereco_Saem()
        {
            var r = AnonimizadorDeTexto.Anonimizar("Reside na rua das flores, centro", Paciente);

            r.Should().NotContain("flores").And.NotContain("centro");
        }

        [Fact]
        public void DataDeNascimento_Sai_MasDataDoExameFica()
        {
            var r = AnonimizadorDeTexto.Anonimizar("Coletado em 10/11/2026, nascido em 15/05/1990", Paciente);

            r.Should().Contain("10/11/2026");
            r.Should().NotContain("15/05/1990");
        }

        [Fact]
        public void TelefoneEmail_Saem()
        {
            var r = AnonimizadorDeTexto.Anonimizar("Fone (24) 99999-1234 e contato@lab.com.br", null);

            r.Should().NotContain("99999").And.NotContain("contato@lab.com.br");
        }

        [Fact]
        public void RegistroProfissional_Sai()
        {
            var r = AnonimizadorDeTexto.Anonimizar("Dr. Carlos CRM-MG 12345", null);

            r.Should().NotContain("12345");
        }

        [Fact]
        public void ValoresClinicos_FicamIntactos()
        {
            var texto = "Glicose: 95 mg/dL\nColesterol total: 180 mg/dL\nCreatinina: 0,9 mg/dL\nLeucócitos: 7.500 /mm3";

            AnonimizadorDeTexto.Anonimizar(texto, null).Should().Be(texto);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void TextoVazio_RetornaVazio(string? texto)
        {
            AnonimizadorDeTexto.Anonimizar(texto, Paciente).Should().BeEmpty();
        }
    }
}