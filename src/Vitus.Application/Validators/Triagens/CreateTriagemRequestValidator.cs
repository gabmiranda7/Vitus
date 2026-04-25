using FluentValidation;
using Vitus.Communication.Triagem.Requests;

namespace Vitus.Application.Validators.Triagens
{
    public class CreateTriagemRequestValidator : AbstractValidator<CreateTriagemRequestJson>
    {
        public CreateTriagemRequestValidator()
        {
            RuleFor(x => x.ConsultaId)
                .NotEmpty().WithMessage("ConsultaId é obrigatório");

            RuleFor(x => x.Observacoes)
                .MaximumLength(500).WithMessage("Observações deve ter no máximo 500 caracteres");

            RuleFor(x => x.PressaoArterial)
                .NotEmpty().WithMessage("Pressão arterial é obrigatória")
                .MaximumLength(20).WithMessage("Pressão arterial deve ter no máximo 20 caracteres");

            RuleFor(x => x.Temperatura)
                .InclusiveBetween(30, 45).WithMessage("Temperatura deve estar entre 30 e 45 graus");
        }
    }
}