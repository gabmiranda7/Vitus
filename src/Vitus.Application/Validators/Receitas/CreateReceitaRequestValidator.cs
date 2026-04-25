using FluentValidation;
using Vitus.Communication.Receita.Requests;

namespace Vitus.Application.Validators.Receitas
{
    public class CreateReceitaRequestValidator : AbstractValidator<CreateReceitaRequestJson>
    {
        public CreateReceitaRequestValidator()
        {
            RuleFor(x => x.ConsultaId)
                .NotEmpty().WithMessage("ConsultaId é obrigatório");

            RuleFor(x => x.Medicamentos)
                .NotEmpty().WithMessage("A receita deve ter pelo menos um medicamento");

            RuleForEach(x => x.Medicamentos).ChildRules(m =>
            {
                m.RuleFor(x => x.Nome)
                    .NotEmpty().WithMessage("Nome do medicamento é obrigatório")
                    .MaximumLength(200).WithMessage("Nome deve ter no máximo 200 caracteres");

                m.RuleFor(x => x.Dosagem)
                    .MaximumLength(50).WithMessage("Dosagem deve ter no máximo 50 caracteres");

                m.RuleFor(x => x.Posologia)
                    .MaximumLength(300).WithMessage("Posologia deve ter no máximo 300 caracteres");
            });
        }
    }
}