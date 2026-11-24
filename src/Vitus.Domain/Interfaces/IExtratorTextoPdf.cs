namespace Vitus.Domain.Interfaces
{
    public interface IExtratorTextoPdf
    {
        // Devolve o texto do PDF ou null quando não há texto selecionável (escaneado, protegido ou corrompido)
        string? ExtrairTexto(byte[] conteudo);
    }
}