using FluentAssertions;
using Vitus.Application.Validators.Consultas;
using Vitus.Application.Validators.Triagens;
using Vitus.Communication.Consulta.Requests;
using Vitus.Communication.Triagem.Requests;

namespace Vitus.Tests.Validators
{
    public class TextosCriptografadosValidatorTests
    {
        private readonly AnotarConsultaRequestValidator _anotar = new();
        private readonly CreateTriagemRequestValidator _triagem = new();

        private static CreateTriagemRequestJson Triagem(string observacoes) => new()
        {
            ConsultaId = Guid.NewGuid(),
            PressaoArterial = "120/80",
            Temperatura = 36.5m,
            Observacoes = observacoes
        };

        [Fact]
        public void Anotacao_NoLimite_EValida()
        {
            _anotar.Validate(new AnotarConsultaRequestJson { Anotacoes = new string('a', 2000) })
                .IsValid.Should().BeTrue();
        }

        [Fact]
        public void Anotacao_AcimaDoLimite_EInvalida()
        {
            var resultado = _anotar.Validate(new AnotarConsultaRequestJson { Anotacoes = new string('a', 2001) });

            resultado.IsValid.Should().BeFalse();
            resultado.Errors.Should().Contain(e => e.ErrorMessage == "Anotações devem ter no máximo 2000 caracteres");
        }

        [Fact]
        public void Anotacao_ComMuitosCaracteresMultibyte_EInvalida()
        {
            // 1600 × 'ã' = 3200 bytes UTF-8, acima do que cabe na coluna depois de criptografado
            var resultado = _anotar.Validate(new AnotarConsultaRequestJson { Anotacoes = new string('ã', 1600) });

            resultado.IsValid.Should().BeFalse();
            resultado.Errors.Should().Contain(e => e.ErrorMessage.Contains("muito longa"));
        }

        [Fact]
        public void Anotacao_ComAcentosDentroDoLimite_EValida()
        {
            _anotar.Validate(new AnotarConsultaRequestJson { Anotacoes = new string('ã', 1400) })
                .IsValid.Should().BeTrue();
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        public void Anotacao_Vazia_EInvalida(string texto)
        {
            _anotar.Validate(new AnotarConsultaRequestJson { Anotacoes = texto }).IsValid.Should().BeFalse();
        }

        [Fact]
        public void Observacoes_NoLimite_SaoValidas()
        {
            _triagem.Validate(Triagem(new string('a', 500))).IsValid.Should().BeTrue();
        }

        [Fact]
        public void Observacoes_AcimaDoLimite_SaoInvalidas()
        {
            _triagem.Validate(Triagem(new string('a', 501))).IsValid.Should().BeFalse();
        }

        [Fact]
        public void Observacoes_ComMuitosCaracteresMultibyte_SaoInvalidas()
        {
            // 400 × 'ã' = 800 bytes UTF-8, acima do limite de armazenamento
            _triagem.Validate(Triagem(new string('ã', 400))).IsValid.Should().BeFalse();
        }
    }
}