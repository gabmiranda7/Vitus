using Vitus.Communication.Auth.Requests;
using Vitus.Communication.Auth.Responses;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.AtualizarPerfil
{
    public class AtualizarPerfilUseCase
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IMedicoRepository _medicoRepository;
        private readonly ITokenService _tokenService;
        private readonly IAuditoriaService _auditoriaService;

        public AtualizarPerfilUseCase(
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

        public async Task<AuthResponseJson> Execute(Guid usuarioId, AtualizarPerfilRequestJson request)
        {
            var usuario = await _usuarioRepository.GetById(usuarioId);

            if (usuario == null)
                throw new DomainException("Usuário não encontrado");

            var nomeAnterior = usuario.Nome;
            usuario.AlterarNome(request.Nome);
            await _usuarioRepository.Update(usuario);

            string? medicoId = null;
            if (usuario.Perfil == PerfilUsuario.Medico)
            {
                var medico = await _medicoRepository.GetByUsuarioId(usuario.Id);
                if (medico != null)
                {
                    medico.DefinirNome(usuario.Nome);
                    await _medicoRepository.Update(medico);
                    medicoId = medico.Id.ToString();
                }
            }

            await _auditoriaService.Registrar(
                AcaoAuditoria.AtualizacaoPerfil, "Usuario", usuario.Id,
                $"Nome alterado de '{nomeAnterior}' para '{usuario.Nome}'");

            return new AuthResponseJson
            {
                Token = _tokenService.Generate(usuario),
                Nome = usuario.Nome,
                Email = usuario.Email,
                Perfil = usuario.Perfil.ToString(),
                MedicoId = medicoId,
                TemFoto = !string.IsNullOrEmpty(usuario.FotoCaminho)
            };
        }
    }
}