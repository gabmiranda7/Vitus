using Vitus.Communication.Auth.Responses;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.ObterUsuarioLogado
{
    public class ObterUsuarioLogadoUseCase
    {
        private readonly IUsuarioRepository _usuarioRepository;

        public ObterUsuarioLogadoUseCase(IUsuarioRepository usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
        }

        public async Task<UsuarioLogadoResponseJson> Execute(string email)
        {
            var usuario = await _usuarioRepository.GetByEmail(email);

            if (usuario == null)
                throw new DomainException("Usuário não encontrado");

            return new UsuarioLogadoResponseJson
            {
                Nome = usuario.Nome,
                Email = usuario.Email,
                Perfil = usuario.Perfil.ToString()
            };
        }
    }
}