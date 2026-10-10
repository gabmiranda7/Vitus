using Vitus.Communication.Auth.Responses;
using Vitus.Domain.Enums;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.GetUsuariosPendentes
{
    public class GetUsuariosPendentesUseCase
    {
        private readonly IUsuarioRepository _usuarioRepository;

        public GetUsuariosPendentesUseCase(IUsuarioRepository usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
        }

        public async Task<IList<UsuarioPendenteResponseJson>> Execute()
        {
            var pendentes = await _usuarioRepository.GetByStatus(StatusUsuario.Pendente);

            return pendentes.Select(u => new UsuarioPendenteResponseJson
            {
                Id = u.Id,
                Nome = u.Nome,
                Email = u.Email,
                Perfil = u.Perfil.ToString()
            }).ToList();
        }
    }
}