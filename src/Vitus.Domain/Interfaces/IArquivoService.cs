namespace Vitus.Domain.Interfaces
{
    public interface IArquivoService
    {
        Task<string> Salvar(Stream conteudo, string nomeOriginal, string subpasta);
        Task<byte[]> Ler(string caminho);
        void Deletar(string caminho);
    }
}