using FluentValidation;
using Vitus.Communication.Consulta.Requests;

namespace Vitus.Application.Validators.Consultas
{
    public class CreateConsultaRequestValidator : AbstractValidator<CreateConsultaRequestJson>
    {
        private static readonly TimeSpan ToleranciaPassado = TimeSpan.FromMinutes(15);

        public CreateConsultaRequestValidator()
        {
            RuleFor(x => x.PacienteId)
                .NotEmpty().WithMessage("PacienteId é obrigatório");

            RuleFor(x => x.MedicoId)
                .NotEmpty().WithMessage("MedicoId é obrigatório");

            RuleFor(x => x.DataConsulta)
                .NotEmpty().WithMessage("Data da consulta é obrigatória")
                .Must(d => d.ToUniversalTime() >= DateTime.UtcNow - ToleranciaPassado)
                .WithMessage("Data da consulta não pode ser no passado");
        }
    }
}