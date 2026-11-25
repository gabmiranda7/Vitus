using FluentValidation;

namespace Vitus.Application.Validators.Auth
{
    public static class SenhaForteExtensions
    {
        public const int TamanhoMinimo = 8;
        public const int TamanhoMaximo = 100;

        /// <summary>
        /// Senha forte: 8 a 100 caracteres, com maiúscula, minúscula, número e símbolo.
        /// </summary>
        public static IRuleBuilderOptions<T, string> SenhaForte<T>(this IRuleBuilder<T, string> rule)
        {
            return rule
                .NotEmpty().WithMessage("Senha é obrigatória")
                .MinimumLength(TamanhoMinimo).WithMessage($"Senha deve ter no mínimo {TamanhoMinimo} caracteres")
                .MaximumLength(TamanhoMaximo).WithMessage($"Senha deve ter no máximo {TamanhoMaximo} caracteres")
                .Matches("[A-Z]").WithMessage("Senha deve conter ao menos uma letra maiúscula")
                .Matches("[a-z]").WithMessage("Senha deve conter ao menos uma letra minúscula")
                .Matches("[0-9]").WithMessage("Senha deve conter ao menos um número")
                .Matches("[^a-zA-Z0-9]").WithMessage("Senha deve conter ao menos um símbolo (ex: ! @ # $ %)");
        }
    }
}
