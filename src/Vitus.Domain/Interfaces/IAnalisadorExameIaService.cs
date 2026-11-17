namespace Vitus.Domain.Interfaces
{
    public record ArquivoExameIaInput(
        byte[] Bytes,
        string ContentType,
        string NomeArquivo);

    public interface IAnalisadorExameIaService
    {
        Task<string> AnalisarExamesAsync(
            IReadOnlyList<ArquivoExameIaInput> arquivos,
            string contextoClinicoAnonimo,
            CancellationToken ct = default);
    }
}