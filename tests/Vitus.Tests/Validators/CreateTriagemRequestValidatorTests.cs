using FluentAssertions;
using Vitus.Application.Validators.Triagens;
using Vitus.Communication.Triagem.Requests;

namespace Vitus.Tests.Validators
{
    public class CreateTriagemRequestValidatorTests
    {
        private readonly CreateTriagemRequestValidator _validator = new();

        private static CreateTriagemRequestJson Request(int? glicemia) => new()
        {
            ConsultaId = Guid.NewGuid(),
            PressaoArterial = "120/80",
            Temperatura = 36.5m,
            Observacoes = "ok",
            Glicemia = glicemia
        };

        [Theory]
        [InlineData(null)]
        [InlineData(20)]
        [InlineData(95)]
        [InlineData(600)]
        public void Glicemia_Opcional_E_Valida_Dentro_Do_Limite(int? valor)
        {
            _validator.Validate(Request(valor)).IsValid.Should().BeTrue();
        }

        [Theory]
        [InlineData(19)]
        [InlineData(601)]
        [InlineData(0)]
        public void Glicemia_Fora_Do_Limite_E_Invalida(int valor)
        {
            var resultado = _validator.Validate(Request(valor));

            resultado.IsValid.Should().BeFalse();
            resultado.Errors.Should().Contain(e => e.ErrorMessage == "Glicemia deve estar entre 20 e 600 mg/dL");
        }
    }
}