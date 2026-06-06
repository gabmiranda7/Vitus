using Vitus.Communication.Auth.Requests;
using Vitus.Communication.Auth.Responses;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.Login
{
    public class LoginUsuarioUseCase
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IMedicoRepository _medicoRepository;
        private readonly ITokenService _tokenService;

        public LoginUsuarioUseCase(
            IUsuarioRepository usuarioRepository,
            IMedicoRepository medicoRepository,
            ITokenService tokenService)
        {
            _usuarioRepository = usuarioRepository;
            _medicoRepository = medicoRepository;
            _tokenService = tokenService;
        }

        public async Task<AuthResponseJson> Execute(LoginRequestJson request)
        {
            var usuario = await _usuarioRepository.GetByEmail(request.Email);

            if (usuario == null)
                throw new DomainException("Email ou senha inválidos");

            var senhaValida = BCrypt.Net.BCrypt.Verify(request.Senha, usuario.SenhaHash);

            if (!senhaValida)
                throw new DomainException("Email ou senha inválidos");

            var token = _tokenService.Generate(usuario);

            string? medicoId = null;
            if (usuario.Perfil.ToString() == "Medico")
            {
                var medicos = await _medicoRepository.GetAll();
                var medico = medicos.FirstOrDefault(m => m.Nome == usuario.Nome);
                medicoId = medico?.Id.ToString();
            }

            return new AuthResponseJson
            {
                Token = token,
                Nome = usuario.Nome,
                Email = usuario.Email,
                Perfil = usuario.Perfil.ToString(),
                MedicoId = medicoId
            };
        }
    }
}