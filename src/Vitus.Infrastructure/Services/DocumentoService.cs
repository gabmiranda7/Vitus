using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.Extensions.Configuration;
using Vitus.Domain.Enums;
using Vitus.Domain.Interfaces;

namespace Vitus.Infrastructure.Services
{
    public class DocumentoService : IDocumentoService
    {
        private readonly string _raizTemplates;

        public DocumentoService(IConfiguration configuration)
        {
            _raizTemplates = configuration["Storage:Templates"] ?? "/app/storage/templates";
        }

        public async Task<byte[]> GerarReceita(
            TipoReceita tipoReceita,
            TipoUso tipoUso,
            string nomePaciente,
            string? enderecoPaciente,
            string nomeMedico,
            string dataReceita,
            List<(string Medicamento, string Posologia)> medicamentos)
        {
            var nomeTemplate = tipoReceita == TipoReceita.Especial
                ? "receita_especial.docx"
                : "receita_comum.docx";

            var caminhoTemplate = Path.Combine(_raizTemplates, nomeTemplate);

            if (!File.Exists(caminhoTemplate))
                throw new FileNotFoundException($"Template não encontrado: {caminhoTemplate}");

            var ms = new MemoryStream();
            await using (var fs = new FileStream(caminhoTemplate, FileMode.Open, FileAccess.Read))
                await fs.CopyToAsync(ms);
            ms.Position = 0;

            using var doc = WordprocessingDocument.Open(ms, true);
            var body = doc.MainDocumentPart!.Document.Body!;
            var paragrafos = body.Elements<Paragraph>().ToList();

            var labelUso = tipoUso switch
            {
                TipoUso.Interno => "Uso Interno:",
                TipoUso.Externo => "Uso Externo:",
                _ => "Uso Oral:"
            };

            foreach (var paragrafo in paragrafos)
            {
                var texto = ObterTexto(paragrafo);

                if (texto.StartsWith("Nome:"))
                    SubstituirTexto(paragrafo, $"Nome: {nomePaciente}");

                else if (texto.StartsWith("End:"))
                    SubstituirTexto(paragrafo, $"End: {enderecoPaciente ?? string.Empty}");

                else if (texto.StartsWith("Uso Oral:") ||
                         texto.StartsWith("Uso Interno:") ||
                         texto.StartsWith("Uso Externo:"))
                    SubstituirTexto(paragrafo, labelUso);
            }

            var parasLista = body.Elements<Paragraph>().ToList();
            var idxUso = parasLista.FindIndex(p =>
                ObterTexto(p).StartsWith("Uso Oral:") ||
                ObterTexto(p).StartsWith("Uso Interno:") ||
                ObterTexto(p).StartsWith("Uso Externo:"));

            if (idxUso >= 0)
            {
                var parasRemover = parasLista.Skip(idxUso + 1)
                    .TakeWhile(p => {
                        var t = ObterTexto(p);
                        return !t.StartsWith("Nome:") &&
                               !t.StartsWith("End:") &&
                               !t.TrimStart().StartsWith("06/") &&
                               !string.IsNullOrWhiteSpace(t) == false || !string.IsNullOrWhiteSpace(t);
                    })
                    .Where(p => {
                        var t = ObterTexto(p);
                        return !t.StartsWith("Nome:") &&
                               !t.TrimStart().Contains("2026") &&
                               !t.TrimStart().Contains("2025") &&
                               !string.IsNullOrWhiteSpace(t);
                    })
                    .ToList();

                foreach (var p in parasRemover)
                    p.Remove();

                parasLista = body.Elements<Paragraph>().ToList();
                idxUso = parasLista.FindIndex(p =>
                    ObterTexto(p).StartsWith("Uso Oral:") ||
                    ObterTexto(p).StartsWith("Uso Interno:") ||
                    ObterTexto(p).StartsWith("Uso Externo:"));

                var referencia = parasLista[idxUso];

                foreach (var (med, pos) in medicamentos)
                {
                    var paraMed = CriarParagrafo(referencia, med);
                    var paraPos = CriarParagrafo(referencia, pos);
                    referencia.InsertAfterSelf(paraPos);
                    referencia.InsertAfterSelf(paraMed);
                }
            }

            parasLista = body.Elements<Paragraph>().ToList();
            var paraData = parasLista.FirstOrDefault(p => ObterTexto(p).Contains("/202"));
            if (paraData != null)
                SubstituirTexto(paraData, $"{new string(' ', 76)}{dataReceita}");

            doc.MainDocumentPart.Document.Save();
            return ms.ToArray();
        }

        private static string ObterTexto(Paragraph paragrafo)
            => string.Concat(paragrafo.Elements<Run>().Select(r => r.InnerText));

        private static void SubstituirTexto(Paragraph paragrafo, string novoTexto)
        {
            var runs = paragrafo.Elements<Run>().ToList();
            if (!runs.Any()) return;

            var primeiroRun = runs.First();
            var textElement = primeiroRun.GetFirstChild<Text>();
            if (textElement == null)
            {
                textElement = new Text();
                primeiroRun.AppendChild(textElement);
            }
            textElement.Text = novoTexto;
            textElement.Space = SpaceProcessingModeValues.Preserve;

            foreach (var run in runs.Skip(1))
                run.Remove();
        }

        private static Paragraph CriarParagrafo(Paragraph referencia, string texto)
        {
            var novoPara = (Paragraph)referencia.CloneNode(false);
            var novoRun = new Run();

            var runRefProps = referencia.Elements<Run>().FirstOrDefault()
                ?.GetFirstChild<RunProperties>();
            if (runRefProps != null)
                novoRun.AppendChild((RunProperties)runRefProps.CloneNode(true));

            var textEl = new Text(texto) { Space = SpaceProcessingModeValues.Preserve };
            novoRun.AppendChild(textEl);
            novoPara.AppendChild(novoRun);
            return novoPara;
        }
    }
}