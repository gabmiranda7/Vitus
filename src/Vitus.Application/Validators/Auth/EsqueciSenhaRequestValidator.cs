using FluentValidation;
using Vitus.Communication.Auth.Requests;

namespace Vitus.Application.Validators.Auth
{
    public class EsqueciSenhaRequestValidator : AbstractValidator<EsqueciSenhaRequestJson>
    {
        public EsqueciSenhaRequestValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email é obrigatório")
                .EmailAddress().WithMessage("Email inválido");
        }
    }
}