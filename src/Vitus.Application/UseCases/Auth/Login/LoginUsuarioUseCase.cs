using Vitus.Communication.Auth.Requests;
using Vitus.Communication.Auth.Responses;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.Login
{
    public class LoginUsuarioUseCase
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IMedicoRepository _medicoRepository;
        private readonly ITokenService _tokenService;
        private readonly ILoginAttemptTracker _tracker;

        public LoginUsuarioUseCase(
            IUsuarioRepository usuarioRepository,
            IMedicoRepository medicoRepository,
            ITokenService tokenService,
            ILoginAttemptTracker tracker)
        {
            _usuarioRepository = usuarioRepository;
            _medicoRepository = medicoRepository;
            _tokenService = tokenService;
            _tracker = tracker;
        }

        public async Task<AuthResponseJson> Execute(LoginRequestJson request)
        {
            var emailNormalizado = request.Email.Trim().ToLowerInvariant();

            var tempoRestante = _tracker.TempoRestanteBloqueio(emailNormalizado);
            if (tempoRestante is not null)
                throw new TentativasExcedidasException(tempoRestante.Value);

            var usuario = await _usuarioRepository.GetByEmail(emailNormalizado);

            if (usuario == null)
            {
                _tracker.RegistrarFalha(emailNormalizado);
                throw new DomainException("Email ou senha inválidos");
            }

            var senhaValida = BCrypt.Net.BCrypt.Verify(request.Senha, usuario.SenhaHash);

            if (!senhaValida)
            {
                _tracker.RegistrarFalha(emailNormalizado);
                throw new DomainException("Email ou senha inválidos");
            }

            _tracker.Limpar(emailNormalizado);

            if (usuario.Status == StatusUsuario.Pendente)
                throw new DomainException("Seu cadastro ainda aguarda aprovação de um administrador");

            if (usuario.Status == StatusUsuario.Recusado)
                throw new DomainException("Seu cadastro não foi aprovado. Entre em contato com um administrador");

            var token = _tokenService.Generate(usuario);

            string? medicoId = null;
            if (usuario.Perfil == PerfilUsuario.Medico)
            {
                var medico = await _medicoRepository.GetByUsuarioId(usuario.Id);
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