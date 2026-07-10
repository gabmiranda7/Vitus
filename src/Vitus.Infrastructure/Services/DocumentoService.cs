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

            var caminhoTemplate = Path.Combine(
                _raizTemplates.Replace('/', Path.DirectorySeparatorChar),
                nomeTemplate);

            if (!File.Exists(caminhoTemplate))
                throw new FileNotFoundException($"Template não encontrado: {caminhoTemplate}");

            var ms = new MemoryStream();
            await using (var fs = new FileStream(caminhoTemplate, FileMode.Open, FileAccess.Read))
                await fs.CopyToAsync(ms);
            ms.Position = 0;

            var labelUso = tipoUso switch
            {
                TipoUso.Interno => "Uso Interno:",
                TipoUso.Externo => "Uso Externo:",
                _ => "Uso Oral:"
            };

            var doc = WordprocessingDocument.Open(ms, true);
            var body = doc.MainDocumentPart!.Document.Body!;

            // Substitui Nome, Endereço, Uso e Data — colapsa todos os runs em um único
            foreach (var para in body.Elements<Paragraph>().ToList())
            {
                var texto = TextoParagrafo(para);

                if (texto.StartsWith("Nome:", StringComparison.OrdinalIgnoreCase))
                    ColapsarRuns(para, $"Nome: {nomePaciente}");

                else if (texto.StartsWith("End:", StringComparison.OrdinalIgnoreCase))
                    ColapsarRuns(para, $"End: {enderecoPaciente ?? string.Empty}");

                else if (texto.StartsWith("Uso ", StringComparison.OrdinalIgnoreCase) &&
                         (texto.Contains("Oral", StringComparison.OrdinalIgnoreCase) ||
                          texto.Contains("Interno", StringComparison.OrdinalIgnoreCase) ||
                          texto.Contains("Externo", StringComparison.OrdinalIgnoreCase)))
                    ColapsarRuns(para, labelUso);

                else if (ContemData(texto))
                    ColapsarRuns(para, $"{new string(' ', 75)}{dataReceita}");
            }

            // Localiza parágrafo de Uso após substituição
            var parasLista = body.Elements<Paragraph>().ToList();
            var idxUso = parasLista.FindIndex(p =>
                TextoParagrafo(p).StartsWith("Uso ", StringComparison.OrdinalIgnoreCase));

            if (idxUso >= 0)
            {
                // Remove parágrafos de medicamento do template (entre Uso e parágrafo vazio/data)
                var parasRemover = new List<Paragraph>();
                for (int i = idxUso + 1; i < parasLista.Count; i++)
                {
                    var t = TextoParagrafo(parasLista[i]);
                    if (string.IsNullOrWhiteSpace(t) || ContemData(t)) break;
                    parasRemover.Add(parasLista[i]);
                }
                foreach (var p in parasRemover) p.Remove();

                // Recarrega e insere medicamentos
                parasLista = body.Elements<Paragraph>().ToList();
                idxUso = parasLista.FindIndex(p =>
                    TextoParagrafo(p).StartsWith("Uso ", StringComparison.OrdinalIgnoreCase));

                var refPara = parasLista[idxUso];

                // Insere em ordem reversa para manter sequência correta
                foreach (var (med, pos) in ((IEnumerable<(string, string)>)medicamentos).Reverse())
                {
                    refPara.InsertAfterSelf(CriarParagrafo(refPara, pos));
                    refPara.InsertAfterSelf(CriarParagrafo(refPara, med));
                }
            }

            doc.MainDocumentPart!.Document.Save();
            doc.Dispose();

            return ms.ToArray();
        }

        private static string TextoParagrafo(Paragraph para)
            => string.Concat(para.Elements<Run>().Select(r => r.InnerText));

        private static bool ContemData(string texto)
            => texto.Contains("/202") || texto.Contains("/203");

        private static void ColapsarRuns(Paragraph para, string novoTexto)
        {
            var runs = para.Elements<Run>().ToList();
            if (runs.Count == 0) return;

            // Pega as propriedades do primeiro run para preservar formatação
            var primeiroRun = runs[0];
            var runProps = primeiroRun.GetFirstChild<RunProperties>();

            // Remove todos os runs
            foreach (var r in runs) r.Remove();

            // Cria um único run novo com o texto completo
            var novoRun = new Run();
            if (runProps != null)
                novoRun.AppendChild((RunProperties)runProps.CloneNode(true));

            novoRun.AppendChild(new Text(novoTexto)
            {
                Space = SpaceProcessingModeValues.Preserve
            });

            para.AppendChild(novoRun);
        }

        private static Paragraph CriarParagrafo(Paragraph referencia, string texto)
        {
            var novoPara = (Paragraph)referencia.CloneNode(false);
            var novoRun = new Run();

            var runRefProps = referencia.Elements<Run>().FirstOrDefault()
                ?.GetFirstChild<RunProperties>();
            if (runRefProps != null)
                novoRun.AppendChild((RunProperties)runRefProps.CloneNode(true));

            novoRun.AppendChild(new Text(texto)
            {
                Space = SpaceProcessingModeValues.Preserve
            });

            novoPara.AppendChild(novoRun);
            return novoPara;
        }
    }
}