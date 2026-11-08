using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.RemoverFotoPerfil
{
    public class RemoverFotoPerfilUseCase
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IArquivoService _arquivoService;
        private readonly IAuditoriaService _auditoriaService;

        public RemoverFotoPerfilUseCase(
            IUsuarioRepository usuarioRepository,
            IArquivoService arquivoService,
            IAuditoriaService auditoriaService)
        {
            _usuarioRepository = usuarioRepository;
            _arquivoService = arquivoService;
            _auditoriaService = auditoriaService;
        }

        public async Task Execute(Guid usuarioId)
        {
            var usuario = await _usuarioRepository.GetById(usuarioId);

            if (usuario == null)
                throw new DomainException("Usuário não encontrado");

            if (string.IsNullOrEmpty(usuario.FotoCaminho))
                return;

            var caminho = usuario.FotoCaminho;

            usuario.RemoverFoto();
            await _usuarioRepository.Update(usuario);
            _arquivoService.Deletar(caminho);

            await _auditoriaService.Registrar(
                AcaoAuditoria.AtualizacaoPerfil, "Usuario", usuario.Id, "Foto de perfil removida");
        }
    }
}