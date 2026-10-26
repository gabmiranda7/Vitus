using Vitus.Communication.Auth.Responses;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.ObterUsuarioLogado
{
    public class ObterUsuarioLogadoUseCase
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IMedicoRepository _medicoRepository;

        public ObterUsuarioLogadoUseCase(
            IUsuarioRepository usuarioRepository,
            IMedicoRepository medicoRepository)
        {
            _usuarioRepository = usuarioRepository;
            _medicoRepository = medicoRepository;
        }

        public async Task<UsuarioLogadoResponseJson> Execute(string email)
        {
            var usuario = await _usuarioRepository.GetByEmail(email);

            if (usuario == null)
                throw new DomainException("Usuário não encontrado");

            string? medicoId = null;
            if (usuario.Perfil == PerfilUsuario.Medico)
            {
                var medico = await _medicoRepository.GetByUsuarioId(usuario.Id);
                medicoId = medico?.Id.ToString();
            }

            return new UsuarioLogadoResponseJson
            {
                Nome = usuario.Nome,
                Email = usuario.Email,
                Perfil = usuario.Perfil.ToString(),
                MedicoId = medicoId
            };
        }
    }
}