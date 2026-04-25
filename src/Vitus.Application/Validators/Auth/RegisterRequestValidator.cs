using FluentValidation;
using Vitus.Communication.Auth.Requests;

namespace Vitus.Application.Validators.Auth
{
    public class RegisterRequestValidator : AbstractValidator<RegisterRequestJson>
    {
        public RegisterRequestValidator()
        {
            RuleFor(x => x.Nome)
                .NotEmpty().WithMessage("Nome é obrigatório")
                .MaximumLength(200).WithMessage("Nome deve ter no máximo 200 caracteres");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email é obrigatório")
                .EmailAddress().WithMessage("Email inválido");

            RuleFor(x => x.Senha)
                .NotEmpty().WithMessage("Senha é obrigatória")
                .MinimumLength(6).WithMessage("Senha deve ter no mínimo 6 caracteres");

            RuleFor(x => x.Perfil)
                .NotEmpty().WithMessage("Perfil é obrigatório")
                .Must(p => new[] { "Medico", "Enfermeiro", "Recepcionista", "Paciente" }.Contains(p))
                .WithMessage("Perfil inválido. Use: Medico, Enfermeiro, Recepcionista ou Paciente");
        }
    }
}