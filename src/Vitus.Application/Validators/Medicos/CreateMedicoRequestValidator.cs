using FluentValidation;
using Vitus.Communication.Medico.Requests;

namespace Vitus.Application.Validators.Medicos
{
    public class CreateMedicoRequestValidator : AbstractValidator<CreateMedicoRequestJson>
    {
        public CreateMedicoRequestValidator()
        {
            RuleFor(x => x.Nome)
                .NotEmpty().WithMessage("Nome é obrigatório")
                .MaximumLength(200).WithMessage("Nome deve ter no máximo 200 caracteres");

            RuleFor(x => x.Especialidade)
                .NotEmpty().WithMessage("Especialidade é obrigatória")
                .MaximumLength(100).WithMessage("Especialidade deve ter no máximo 100 caracteres");

            RuleFor(x => x.CRM)
                .NotEmpty().WithMessage("CRM é obrigatório")
                .MaximumLength(20).WithMessage("CRM deve ter no máximo 20 caracteres");
        }
    }
}