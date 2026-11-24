using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Vitus.Application.UseCases.Exames.AnalisarExameIa
{
    public record IdentificadoresPaciente(
        string? Nome,
        string? NomeMae,
        string? NomePai,
        string? Endereco,
        DateOnly? DataNascimento);

    public static class AnonimizadorDeTexto
    {
        public const string Marcador = "[OMITIDO]";

        private static readonly TimeSpan LimiteTempo = TimeSpan.FromSeconds(2);
        private const RegexOptions Opcoes = RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled;

        private static Regex Criar(string padrao, RegexOptions extras = RegexOptions.None) =>
            new(padrao, Opcoes | extras, LimiteTempo);

        // Linhas do tipo "Rótulo: valor" em que o valor identifica pessoas (o rótulo é mantido)
        private static readonly Regex LinhaRotulada = Criar(
            @"^[ \t]*(?<rotulo>paciente|nome(?:\s+do\s+paciente|\s+da\s+m[aã]e|\s+do\s+pai|\s+social)?|m[aã]e|pai|filia[cç][aã]o|respons[aá]vel|endere[cç]o|logradouro|bairro|telefone|fone|celular|contato|e-?mail|cpf|rg|cns|cart[aã]o\s+sus|data\s+de\s+nascimento|nascimento|dt\.?\s*nasc\.?|m[eé]dico(?:\s+solicitante)?|solicitante|requisitante|prontu[aá]rio|protocolo|conv[eê]nio|carteirinha|matr[ií]cula)[ \t]*[:\-][ \t]*(?<valor>.+)$",
            RegexOptions.Multiline);

        private static readonly Regex[] PadroesEstruturados =
        {
            Criar(@"(?<!\d)\d{3}\.?\d{4}\.?\d{4}\.?\d{4}(?!\d)"),   // cartão SUS (15 dígitos)
            Criar(@"(?<!\d)\d{3}\.?\d{3}\.?\d{3}-?\d{2}(?!\d)"),    // CPF
            Criar(@"[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}"),      // e-mail
            Criar(@"(?<!\d)\(?\d{2}\)?\s?9?\d{4}-?\d{4}(?!\d)"),    // telefone
            Criar(@"(?<!\d)\d{5}-\d{3}(?!\d)"),                     // CEP
            Criar(@"\b(?:CRM|CRBM|CRF|CRBIO|CRN|CRP|COREN|CREFITO)\s*[-/:]?\s*(?:[A-Z]{2}\s*[-/:]?\s*)?\d{3,}\b"), // registro profissional
        };

        public static string Anonimizar(string? texto, IdentificadoresPaciente? identificadores = null)
        {
            if (string.IsNullOrWhiteSpace(texto))
                return string.Empty;

            var resultado = LinhaRotulada.Replace(texto, "${rotulo}: " + Marcador);

            foreach (var padrao in PadroesEstruturados)
                resultado = padrao.Replace(resultado, Marcador);

            if (identificadores != null)
            {
                foreach (var padrao in PadroesDoPaciente(identificadores))
                    resultado = padrao.Replace(resultado, Marcador);
            }

            return resultado.Trim();
        }

        private static IEnumerable<Regex> PadroesDoPaciente(IdentificadoresPaciente ids)
        {
            var frases = new List<string>();
            var palavras = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var nome in new[] { ids.Nome, ids.NomeMae, ids.NomePai })
            {
                var partes = Palavras(nome);
                if (partes.Count == 0) continue;

                frases.Add(string.Join(@"[\s,]+", partes.Select(PadraoSemAcento)));

                foreach (var parte in partes.Where(p => p.Length >= 4))
                    palavras.Add(parte);
            }

            if (!string.IsNullOrWhiteSpace(ids.Endereco))
            {
                foreach (var trecho in ids.Endereco.Split(',', ';', '\n'))
                {
                    var partes = Palavras(trecho);
                    if (string.Join(" ", partes).Length >= 5)
                        frases.Add(string.Join(@"[\s,]+", partes.Select(PadraoSemAcento)));
                }
            }

            foreach (var frase in frases.Distinct())
                yield return Criar($@"(?<![\p{{L}}\p{{N}}]){frase}(?![\p{{L}}\p{{N}}])");

            foreach (var palavra in palavras)
                yield return Criar($@"(?<!\p{{L}}){PadraoSemAcento(palavra)}(?!\p{{L}})");

            if (ids.DataNascimento is { } nascimento)
            {
                foreach (var formato in new[] { "dd/MM/yyyy", "dd-MM-yyyy", "dd.MM.yyyy", "yyyy-MM-dd" })
                {
                    var data = nascimento.ToString(formato, CultureInfo.InvariantCulture);
                    yield return Criar($@"(?<!\d){Regex.Escape(data)}(?!\d)");
                }
            }
        }

        private static List<string> Palavras(string? texto) =>
            string.IsNullOrWhiteSpace(texto)
                ? new List<string>()
                : Regex.Split(texto, @"[^\p{L}\p{N}]+").Where(p => p.Length > 0).ToList();

        // Casa a palavra com ou sem acento (João / Joao)
        private static string PadraoSemAcento(string palavra)
        {
            var sb = new StringBuilder();

            foreach (var c in palavra)
            {
                sb.Append(char.ToLowerInvariant(c) switch
                {
                    'a' or 'á' or 'à' or 'â' or 'ã' or 'ä' => "[aáàâãä]",
                    'e' or 'é' or 'è' or 'ê' or 'ë' => "[eéèêë]",
                    'i' or 'í' or 'ì' or 'î' or 'ï' => "[iíìîï]",
                    'o' or 'ó' or 'ò' or 'ô' or 'õ' or 'ö' => "[oóòôõö]",
                    'u' or 'ú' or 'ù' or 'û' or 'ü' => "[uúùûü]",
                    'c' or 'ç' => "[cç]",
                    'n' or 'ñ' => "[nñ]",
                    _ => Regex.Escape(c.ToString())
                });
            }

            return sb.ToString();
        }
    }
}