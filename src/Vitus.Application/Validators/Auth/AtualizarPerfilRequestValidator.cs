using FluentValidation;
using Vitus.Communication.Auth.Requests;

namespace Vitus.Application.Validators.Auth
{
    public class AtualizarPerfilRequestValidator : AbstractValidator<AtualizarPerfilRequestJson>
    {
        public AtualizarPerfilRequestValidator()
        {
            RuleFor(x => x.Nome)
                .NotEmpty().WithMessage("Nome é obrigatório")
                .MaximumLength(200).WithMessage("Nome deve ter no máximo 200 caracteres");
        }
    }
}