using System.Text;
using FluentValidation;
using Vitus.Communication.Triagem.Requests;

namespace Vitus.Application.Validators.Triagens
{
    public class CreateTriagemRequestValidator : AbstractValidator<CreateTriagemRequestJson>
    {
        public const int MaximoCaracteresObservacoes = 500;
        // Limite de bytes UTF-8 que, depois de criptografado e em base64, ainda cabe na coluna de 1000
        public const int MaximoBytesObservacoes = 719;

        public CreateTriagemRequestValidator()
        {
            RuleFor(x => x.ConsultaId)
                .NotEmpty().WithMessage("ConsultaId é obrigatório");

            RuleFor(x => x.Observacoes)
                .MaximumLength(MaximoCaracteresObservacoes)
                    .WithMessage($"Observações deve ter no máximo {MaximoCaracteresObservacoes} caracteres")
                .Must(t => t == null || Encoding.UTF8.GetByteCount(t) <= MaximoBytesObservacoes)
                    .WithMessage("Observações muito longas para serem armazenadas. Reduza o texto");

            RuleFor(x => x.PressaoArterial)
                .NotEmpty().WithMessage("Pressão arterial é obrigatória")
                .MaximumLength(20).WithMessage("Pressão arterial deve ter no máximo 20 caracteres");

            RuleFor(x => x.Temperatura)
                .InclusiveBetween(30, 45).WithMessage("Temperatura deve estar entre 30 e 45 graus");

            RuleFor(x => x.Glicemia)
                .InclusiveBetween(20, 600).WithMessage("Glicemia deve estar entre 20 e 600 mg/dL")
                .When(x => x.Glicemia.HasValue);
        }
    }
}