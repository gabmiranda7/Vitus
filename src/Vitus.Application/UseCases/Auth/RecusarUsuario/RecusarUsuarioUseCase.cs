using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.RecusarUsuario
{
    public class RecusarUsuarioUseCase
    {
        private readonly IUsuarioRepository _usuarioRepository;

        public RecusarUsuarioUseCase(IUsuarioRepository usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
        }

        public async Task Execute(Guid id)
        {
            var usuario = await _usuarioRepository.GetById(id);

            if (usuario == null)
                throw new DomainException("Usuário não encontrado");

            usuario.Recusar();
            await _usuarioRepository.Update(usuario);
        }
    }
}