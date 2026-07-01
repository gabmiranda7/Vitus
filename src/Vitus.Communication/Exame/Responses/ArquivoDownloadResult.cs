namespace Vitus.Communication.Exame.Responses
{
    public record ArquivoDownloadResult(
        byte[] Conteudo,
        string ContentType,
        string NomeArquivo);
}