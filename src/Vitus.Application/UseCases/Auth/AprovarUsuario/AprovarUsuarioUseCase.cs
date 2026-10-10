using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.AprovarUsuario
{
    public class AprovarUsuarioUseCase
    {
        private readonly IUsuarioRepository _usuarioRepository;

        public AprovarUsuarioUseCase(IUsuarioRepository usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
        }

        public async Task Execute(Guid id)
        {
            var usuario = await _usuarioRepository.GetById(id);

            if (usuario == null)
                throw new DomainException("Usuário não encontrado");

            usuario.Aprovar();
            await _usuarioRepository.Update(usuario);
        }
    }
}