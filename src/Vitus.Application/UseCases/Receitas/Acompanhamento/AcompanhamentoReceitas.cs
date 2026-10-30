using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Vitus.Domain.Entities;
using Vitus.Domain.ValueObjects;

namespace Vitus.Application.UseCases.Receitas.Acompanhamento
{
    public static class AcompanhamentoReceitas
    {
        public static IReadOnlyList<TratamentoAcompanhado> Calcular(IEnumerable<Receita> receitas, DateOnly hoje)
        {
            return receitas
                .SelectMany(r => r.Medicamentos.Select(m => (Receita: r, Medicamento: m)))
                .GroupBy(x => Normalizar(x.Medicamento.Nome))
                .Select(g => g.OrderByDescending(x => x.Receita.DataEmissao).First())
                .Where(x => x.Medicamento.AcompanharVencimento && x.Medicamento.ValidadeDias.HasValue)
                .Select(x =>
                {
                    var dias = x.Medicamento.ValidadeDias!.Value;
                    var vencimento = DateOnly.FromDateTime(x.Receita.DataEmissao).AddDays(dias);

                    return new TratamentoAcompanhado(
                        x.Medicamento.Nome,
                        x.Receita.Id,
                        x.Receita.DataEmissao,
                        dias,
                        vencimento,
                        vencimento.DayNumber - hoje.DayNumber);
                })
                .OrderBy(t => t.DiasRestantes)
                .ToList();
        }

        public static string Normalizar(string nome)
        {
            var decomposto = nome.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
            var semAcento = new StringBuilder();

            foreach (var c in decomposto)
                if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                    semAcento.Append(c);

            return Regex.Replace(semAcento.ToString().Normalize(NormalizationForm.FormC), @"\s+", " ");
        }
    }
}