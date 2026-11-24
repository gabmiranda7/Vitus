namespace Vitus.Domain.Interfaces
{
    public record DocumentoExameIaInput(string Texto);

    public interface IAnalisadorExameIaService
    {
        Task<string> AnalisarExamesAsync(
            IReadOnlyList<DocumentoExameIaInput> documentos,
            string contextoClinicoAnonimo,
            CancellationToken ct = default);
    }
}