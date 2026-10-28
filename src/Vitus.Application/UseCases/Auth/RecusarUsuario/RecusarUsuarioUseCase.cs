using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.RecusarUsuario
{
    public class RecusarUsuarioUseCase
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IAuditoriaService _auditoriaService;

        public RecusarUsuarioUseCase(IUsuarioRepository usuarioRepository, IAuditoriaService auditoriaService)
        {
            _usuarioRepository = usuarioRepository;
            _auditoriaService = auditoriaService;
        }

        public async Task Execute(Guid id)
        {
            var usuario = await _usuarioRepository.GetById(id);

            if (usuario == null)
                throw new DomainException("Usuário não encontrado");

            usuario.Recusar();
            await _usuarioRepository.Update(usuario);

            await _auditoriaService.Registrar(AcaoAuditoria.RecusaCadastro, "Usuario", usuario.Id, $"{usuario.Nome} ({usuario.Perfil})");
        }
    }
}