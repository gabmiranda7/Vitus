using System.Text;
using FluentValidation;
using Vitus.Communication.Consulta.Requests;

namespace Vitus.Application.Validators.Consultas
{
    public class AnotarConsultaRequestValidator : AbstractValidator<AnotarConsultaRequestJson>
    {
        public const int MaximoCaracteres = 2000;
        // Limite de bytes UTF-8 que, depois de criptografado e em base64, ainda cabe na coluna de 4000
        public const int MaximoBytes = 2975;

        public AnotarConsultaRequestValidator()
        {
            RuleFor(x => x.Anotacoes)
                .NotEmpty().WithMessage("Anotação não pode ser vazia")
                .MaximumLength(MaximoCaracteres)
                    .WithMessage($"Anotações devem ter no máximo {MaximoCaracteres} caracteres")
                .Must(t => t == null || Encoding.UTF8.GetByteCount(t) <= MaximoBytes)
                    .WithMessage("Anotação muito longa para ser armazenada. Reduza o texto");
        }
    }
}