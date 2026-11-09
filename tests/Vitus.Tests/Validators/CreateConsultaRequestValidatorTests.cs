using FluentAssertions;
using Vitus.Application.Validators.Consultas;
using Vitus.Communication.Consulta.Requests;

namespace Vitus.Tests.Validators
{
    public class CreateConsultaRequestValidatorTests
    {
        private readonly CreateConsultaRequestValidator _validator = new();

        private static CreateConsultaRequestJson Request(int minutos) => new()
        {
            PacienteId = Guid.NewGuid(),
            MedicoId = Guid.NewGuid(),
            DataConsulta = DateTime.UtcNow.AddMinutes(minutos)
        };

        [Theory]
        [InlineData(10)]
        [InlineData(-1)]
        [InlineData(-10)]
        public void Data_proxima_do_agora_e_valida(int minutos)
        {
            _validator.Validate(Request(minutos)).IsValid.Should().BeTrue();
        }

        [Fact]
        public void Data_muito_no_passado_e_invalida()
        {
            var resultado = _validator.Validate(Request(-30));

            resultado.IsValid.Should().BeFalse();
            resultado.Errors.Should().Contain(e => e.ErrorMessage == "Data da consulta não pode ser no passado");
        }
    }
}