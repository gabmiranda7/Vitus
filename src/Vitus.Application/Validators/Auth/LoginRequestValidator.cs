using FluentValidation;
using Vitus.Communication.Auth.Requests;

namespace Vitus.Application.Validators.Auth
{
    public class LoginRequestValidator : AbstractValidator<LoginRequestJson>
    {
        public LoginRequestValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email é obrigatório")
                .EmailAddress().WithMessage("Email inválido");

            RuleFor(x => x.Senha)
                .NotEmpty().WithMessage("Senha é obrigatória");
        }
    }
}