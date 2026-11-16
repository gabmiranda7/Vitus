using Vitus.Communication.Auth.Responses;
using Vitus.Domain.Enums;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.GetAllUsuarios
{
    public class GetAllUsuariosUseCase
    {
        private readonly IUsuarioRepository _usuarioRepository;

        public GetAllUsuariosUseCase(IUsuarioRepository usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
        }

        public async Task<IList<UsuarioAdminResponseJson>> Execute()
        {
            var usuarios = await _usuarioRepository.GetAll();

            return usuarios
                .Where(u => u.Status == StatusUsuario.Aprovado || u.Status == StatusUsuario.Inativo)
                .Select(u => new UsuarioAdminResponseJson
                {
                    Id = u.Id,
                    Nome = u.Nome,
                    Email = u.Email,
                    Perfil = u.Perfil.ToString(),
                    Status = u.Status.ToString()
                })
                .ToList();
        }
    }
}