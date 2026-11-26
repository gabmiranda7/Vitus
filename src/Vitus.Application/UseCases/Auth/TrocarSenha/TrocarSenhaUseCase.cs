using Vitus.Communication.Auth.Requests;
using Vitus.Communication.Auth.Responses;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.TrocarSenha
{
    public class TrocarSenhaUseCase
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IMedicoRepository _medicoRepository;
        private readonly ITokenService _tokenService;
        private readonly IAuditoriaService _auditoriaService;

        public TrocarSenhaUseCase(
            IUsuarioRepository usuarioRepository,
            IMedicoRepository medicoRepository,
            ITokenService tokenService,
            IAuditoriaService auditoriaService)
        {
            _usuarioRepository = usuarioRepository;
            _medicoRepository = medicoRepository;
            _tokenService = tokenService;
            _auditoriaService = auditoriaService;
        }

        public async Task<AuthResponseJson> Execute(Guid usuarioId, TrocarSenhaRequestJson request)
        {
            var usuario = await _usuarioRepository.GetById(usuarioId);

            if (usuario == null)
                throw new DomainException("Usuário não encontrado");

            if (!BCrypt.Net.BCrypt.Verify(request.SenhaAtual, usuario.SenhaHash))
                throw new DomainException("Senha atual incorreta");

            usuario.DefinirNovaSenha(BCrypt.Net.BCrypt.HashPassword(request.NovaSenha));
            await _usuarioRepository.Update(usuario);

            await _auditoriaService.Registrar(
                AcaoAuditoria.TrocaDeSenha,
                "Usuario",
                usuario.Id,
                $"Senha alterada pelo próprio usuário: {usuario.Email}");

            string? medicoId = null;
            if (usuario.Perfil == PerfilUsuario.Medico)
            {
                var medico = await _medicoRepository.GetByUsuarioId(usuario.Id);
                medicoId = medico?.Id.ToString();
            }

            return new AuthResponseJson
            {
                Token = _tokenService.Generate(usuario),
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