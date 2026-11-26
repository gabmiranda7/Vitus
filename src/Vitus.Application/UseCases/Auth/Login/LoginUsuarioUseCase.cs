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
        private readonly IAuditoriaService _auditoriaService;

        public LoginUsuarioUseCase(
            IUsuarioRepository usuarioRepository,
            IMedicoRepository medicoRepository,
            ITokenService tokenService,
            ILoginAttemptTracker tracker,
            IAuditoriaService auditoriaService)
        {
            _usuarioRepository = usuarioRepository;
            _medicoRepository = medicoRepository;
            _tokenService = tokenService;
            _tracker = tracker;
            _auditoriaService = auditoriaService;
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
                await _auditoriaService.RegistrarComo(
                    Guid.Empty,
                    emailNormalizado,
                    AcaoAuditoria.LoginFalha,
                    "Usuario",
                    Guid.Empty,
                    $"Tentativa de login com e-mail não cadastrado: {emailNormalizado}"
                );
                throw new DomainException("Email ou senha inválidos");
            }

            var senhaValida = BCrypt.Net.BCrypt.Verify(request.Senha, usuario.SenhaHash);

            if (!senhaValida)
            {
                _tracker.RegistrarFalha(emailNormalizado);
                await _auditoriaService.RegistrarComo(
                    usuario.Id,
                    usuario.Nome,
                    AcaoAuditoria.LoginFalha,
                    "Usuario",
                    usuario.Id,
                    $"Senha incorreta para o usuário {usuario.Email}"
                );
                throw new DomainException("Email ou senha inválidos");
            }

            _tracker.Limpar(emailNormalizado);

            if (usuario.Status == StatusUsuario.Pendente)
            {
                await _auditoriaService.RegistrarComo(
                    usuario.Id,
                    usuario.Nome,
                    AcaoAuditoria.LoginFalha,
                    "Usuario",
                    usuario.Id,
                    $"Tentativa de login com cadastro pendente: {usuario.Email}"
                );
                throw new DomainException("Seu cadastro ainda aguarda aprovação de um administrador");
            }

            if (usuario.Status == StatusUsuario.Recusado)
            {
                await _auditoriaService.RegistrarComo(
                    usuario.Id,
                    usuario.Nome,
                    AcaoAuditoria.LoginFalha,
                    "Usuario",
                    usuario.Id,
                    $"Tentativa de login com cadastro recusado: {usuario.Email}"
                );
                throw new DomainException("Seu cadastro não foi aprovado. Entre em contato com um administrador");
            }

            if (usuario.Status == StatusUsuario.Inativo)
            {
                await _auditoriaService.RegistrarComo(
                    usuario.Id,
                    usuario.Nome,
                    AcaoAuditoria.LoginFalha,
                    "Usuario",
                    usuario.Id,
                    $"Tentativa de login com conta inativa: {usuario.Email}"
                );
                throw new DomainException("Sua conta está desativada. Entre em contato com um administrador");
            }

            var token = _tokenService.Generate(usuario);

            string? medicoId = null;
            if (usuario.Perfil == PerfilUsuario.Medico)
            {
                var medico = await _medicoRepository.GetByUsuarioId(usuario.Id);
                medicoId = medico?.Id.ToString();
            }

            await _auditoriaService.RegistrarComo(
                usuario.Id,
                usuario.Nome,
                AcaoAuditoria.LoginSucesso,
                "Usuario",
                usuario.Id,
                $"Login realizado com sucesso ({usuario.Perfil})"
            );

            return new AuthResponseJson
            {
                Token = token,
                Nome = usuario.Nome,
                Email = usuario.Email,
                Perfil = usuario.Perfil.ToString(),
                MedicoId = medicoId,
                TemFoto = !string.IsNullOrEmpty(usuario.FotoCaminho),
                DeveTrocarSenha = usuario.DeveTrocarSenha
            };
        }
    }
}