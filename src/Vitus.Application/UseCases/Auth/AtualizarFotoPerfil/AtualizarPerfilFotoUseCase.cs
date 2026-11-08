using Microsoft.AspNetCore.Http;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.AtualizarFotoPerfil
{
    public class AtualizarFotoPerfilUseCase
    {
        private const long TamanhoMaximo = 2 * 1024 * 1024;

        private static readonly Dictionary<string, byte[][]> AssinaturasValidas = new()
        {
            [".png"] = new[] { new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A } },
            [".jpg"] = new[] { new byte[] { 0xFF, 0xD8, 0xFF } },
            [".jpeg"] = new[] { new byte[] { 0xFF, 0xD8, 0xFF } },
        };

        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IArquivoService _arquivoService;
        private readonly IAuditoriaService _auditoriaService;

        public AtualizarFotoPerfilUseCase(
            IUsuarioRepository usuarioRepository,
            IArquivoService arquivoService,
            IAuditoriaService auditoriaService)
        {
            _usuarioRepository = usuarioRepository;
            _arquivoService = arquivoService;
            _auditoriaService = auditoriaService;
        }

        public async Task Execute(Guid usuarioId, IFormFile arquivo)
        {
            var usuario = await _usuarioRepository.GetById(usuarioId);

            if (usuario == null)
                throw new DomainException("Usuário não encontrado");

            var extensao = Path.GetExtension(arquivo.FileName).ToLowerInvariant();

            if (!AssinaturasValidas.ContainsKey(extensao))
                throw new DomainException("Formato inválido. Use JPG ou PNG");

            if (arquivo.Length > TamanhoMaximo)
                throw new DomainException("Imagem muito grande. Tamanho máximo: 2MB");

            await ValidarConteudoReal(arquivo, extensao);

            var caminhoAntigo = usuario.FotoCaminho;

            using var stream = arquivo.OpenReadStream();
            var caminho = await _arquivoService.Salvar(stream, arquivo.FileName, "perfis");

            usuario.DefinirFoto(caminho);
            await _usuarioRepository.Update(usuario);

            if (!string.IsNullOrEmpty(caminhoAntigo))
                _arquivoService.Deletar(caminhoAntigo);

            await _auditoriaService.Registrar(
                AcaoAuditoria.AtualizacaoPerfil, "Usuario", usuario.Id, "Foto de perfil atualizada");
        }

        private static async Task ValidarConteudoReal(IFormFile arquivo, string extensao)
        {
            var assinaturas = AssinaturasValidas[extensao];
            var tamanho = assinaturas.Max(a => a.Length);

            var buffer = new byte[tamanho];
            using (var stream = arquivo.OpenReadStream())
            {
                var lidos = await stream.ReadAsync(buffer, 0, buffer.Length);
                if (lidos < tamanho)
                    throw new DomainException("Arquivo corrompido ou inválido");
            }

            var valido = assinaturas.Any(a => buffer.Take(a.Length).SequenceEqual(a));

            if (!valido)
                throw new DomainException("O conteúdo do arquivo não corresponde ao formato declarado");
        }
    }
}