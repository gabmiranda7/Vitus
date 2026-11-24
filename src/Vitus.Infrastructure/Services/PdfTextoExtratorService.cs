using System.Text;
using UglyToad.PdfPig;
using UglyToad.PdfPig.DocumentLayoutAnalysis.TextExtractor;
using Vitus.Domain.Interfaces;

namespace Vitus.Infrastructure.Services
{
    public class PdfTextoExtratorService : IExtratorTextoPdf
    {
        private const int MinimoCaracteresUteis = 50;
        private const int MaximoPaginas = 50;

        public string? ExtrairTexto(byte[] conteudo)
        {
            try
            {
                using var documento = PdfDocument.Open(conteudo);
                var texto = new StringBuilder();
                var paginas = 0;

                foreach (var pagina in documento.GetPages())
                {
                    if (++paginas > MaximoPaginas)
                        break;

                    texto.AppendLine(ContentOrderTextExtractor.GetText(pagina));
                }

                var resultado = texto.ToString();
                var uteis = resultado.Count(c => !char.IsWhiteSpace(c));

                return uteis >= MinimoCaracteresUteis ? resultado : null;
            }
            catch (Exception)
            {
                // PDF protegido, corrompido ou em formato que a biblioteca não lê
                return null;
            }
        }
    }
}