using Vitus.Communication.Exame.Responses;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.ObterFotoPerfil
{
    public class ObterFotoPerfilUseCase
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IArquivoService _arquivoService;

        public ObterFotoPerfilUseCase(IUsuarioRepository usuarioRepository, IArquivoService arquivoService)
        {
            _usuarioRepository = usuarioRepository;
            _arquivoService = arquivoService;
        }

        public async Task<ArquivoDownloadResult?> Execute(Guid usuarioId)
        {
            var usuario = await _usuarioRepository.GetById(usuarioId);

            if (usuario == null)
                throw new DomainException("Usuário não encontrado");

            if (string.IsNullOrEmpty(usuario.FotoCaminho))
                return null;

            byte[] conteudo;
            try
            {
                conteudo = await _arquivoService.Ler(usuario.FotoCaminho);
            }
            catch (FileNotFoundException)
            {
                return null;
            }

            var contentType = Path.GetExtension(usuario.FotoCaminho).ToLowerInvariant() == ".png"
                ? "image/png"
                : "image/jpeg";

            return new ArquivoDownloadResult(conteudo, contentType, "perfil");
        }
    }
}