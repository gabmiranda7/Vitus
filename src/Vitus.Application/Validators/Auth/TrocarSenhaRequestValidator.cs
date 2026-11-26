using FluentValidation;
using Vitus.Communication.Auth.Requests;

namespace Vitus.Application.Validators.Auth
{
    public class TrocarSenhaRequestValidator : AbstractValidator<TrocarSenhaRequestJson>
    {
        public TrocarSenhaRequestValidator()
        {
            RuleFor(x => x.SenhaAtual)
                .NotEmpty().WithMessage("Senha atual é obrigatória");

            RuleFor(x => x.NovaSenha)
                .SenhaForte()
                .NotEqual(x => x.SenhaAtual).WithMessage("A nova senha deve ser diferente da atual");
        }
    }
}