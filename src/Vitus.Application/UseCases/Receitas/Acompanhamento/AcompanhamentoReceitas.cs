using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Vitus.Domain.Entities;
using Vitus.Domain.ValueObjects;

namespace Vitus.Application.UseCases.Receitas.Acompanhamento
{
    public static class AcompanhamentoReceitas
    {
        private static readonly TimeZoneInfo FusoBrasil = ResolverFuso();

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
                    var vencimento = DataLocal(x.Receita.DataEmissao).AddDays(dias);

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

        public static DateOnly Hoje() => DataLocal(DateTime.UtcNow);

        public static string DataFormatada() =>
            ConverterParaBrasil(DateTime.UtcNow).ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);

        public static DateOnly DataLocal(DateTime utc) => DateOnly.FromDateTime(ConverterParaBrasil(utc));

        public static string Normalizar(string nome)
        {
            var decomposto = nome.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
            var semAcento = new StringBuilder();

            foreach (var c in decomposto)
                if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                    semAcento.Append(c);

            return Regex.Replace(semAcento.ToString().Normalize(NormalizationForm.FormC), @"\s+", " ");
        }

        private static DateTime ConverterParaBrasil(DateTime utc)
        {
            var instante = utc.Kind == DateTimeKind.Local
                ? utc.ToUniversalTime()
                : DateTime.SpecifyKind(utc, DateTimeKind.Utc);

            return TimeZoneInfo.ConvertTimeFromUtc(instante, FusoBrasil);
        }

        private static TimeZoneInfo ResolverFuso()
        {
            foreach (var id in new[] { "America/Sao_Paulo", "E. South America Standard Time" })
            {
                try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
                catch (TimeZoneNotFoundException) { }
                catch (InvalidTimeZoneException) { }
            }

            return TimeZoneInfo.CreateCustomTimeZone("BRT", TimeSpan.FromHours(-3), "Brasília", "Brasília");
        }
    }
}