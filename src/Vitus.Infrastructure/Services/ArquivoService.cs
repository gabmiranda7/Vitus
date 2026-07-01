using Microsoft.Extensions.Configuration;
using Vitus.Domain.Interfaces;

namespace Vitus.Infrastructure.Services
{
    public class ArquivoService : IArquivoService
    {
        private readonly string _raiz;

        public ArquivoService(IConfiguration configuration)
        {
            _raiz = configuration["Storage:Raiz"] ?? "/app/storage";
        }

        public async Task<string> Salvar(Stream conteudo, string nomeOriginal, string subpasta)
        {
            var pasta = Path.Combine(_raiz, subpasta);
            Directory.CreateDirectory(pasta);

            var nomeArquivo = $"{Guid.NewGuid()}{Path.GetExtension(nomeOriginal)}";
            var caminho = Path.Combine(pasta, nomeArquivo);

            using var stream = new FileStream(caminho, FileMode.Create);
            await conteudo.CopyToAsync(stream);

            return caminho;
        }

        public async Task<byte[]> Ler(string caminho)
        {
            if (!File.Exists(caminho))
                throw new FileNotFoundException("Arquivo não encontrado no servidor");

            return await File.ReadAllBytesAsync(caminho);
        }

        public void Deletar(string caminho)
        {
            if (File.Exists(caminho))
                File.Delete(caminho);
        }
    }
}