using FluentValidation;
using Vitus.Communication.Paciente.Requests;

namespace Vitus.Application.Validators.Pacientes
{
    public class UpdatePacienteRequestValidator : AbstractValidator<UpdatePacienteRequestJson>
    {
        public UpdatePacienteRequestValidator()
        {
            RuleFor(x => x.Nome)
                .NotEmpty().WithMessage("Nome é obrigatório")
                .MaximumLength(200).WithMessage("Nome deve ter no máximo 200 caracteres");
        }
    }
}