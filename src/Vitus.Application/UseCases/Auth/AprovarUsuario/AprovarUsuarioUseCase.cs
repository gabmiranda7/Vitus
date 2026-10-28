using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.AprovarUsuario
{
    public class AprovarUsuarioUseCase
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IAuditoriaService _auditoriaService;

        public AprovarUsuarioUseCase(IUsuarioRepository usuarioRepository, IAuditoriaService auditoriaService)
        {
            _usuarioRepository = usuarioRepository;
            _auditoriaService = auditoriaService;
        }

        public async Task Execute(Guid id)
        {
            var usuario = await _usuarioRepository.GetById(id);

            if (usuario == null)
                throw new DomainException("Usuário não encontrado");

            usuario.Aprovar();
            await _usuarioRepository.Update(usuario);

            await _auditoriaService.Registrar(AcaoAuditoria.AprovacaoCadastro, "Usuario", usuario.Id, $"{usuario.Nome} ({usuario.Perfil})");
        }
    }
}