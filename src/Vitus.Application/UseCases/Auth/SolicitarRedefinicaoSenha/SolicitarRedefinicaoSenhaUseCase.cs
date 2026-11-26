using Vitus.Communication.Auth.Requests;
using Vitus.Domain.Enums;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.SolicitarRedefinicaoSenha
{
    public class SolicitarRedefinicaoSenhaUseCase
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IAuditoriaService _auditoriaService;

        public SolicitarRedefinicaoSenhaUseCase(
            IUsuarioRepository usuarioRepository,
            IAuditoriaService auditoriaService)
        {
            _usuarioRepository = usuarioRepository;
            _auditoriaService = auditoriaService;
        }

        /// <summary>
        /// Sempre conclui sem erro, exista ou não o e-mail, para não revelar quais contas existem.
        /// </summary>
        public async Task Execute(EsqueciSenhaRequestJson request)
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var usuario = await _usuarioRepository.GetByEmail(email);

            if (usuario == null || usuario.Status != StatusUsuario.Aprovado)
                return;

            usuario.SolicitarRedefinicaoSenha();
            await _usuarioRepository.Update(usuario);

            await _auditoriaService.RegistrarComo(
                usuario.Id,
                usuario.Nome,
                AcaoAuditoria.SolicitacaoRedefinicaoSenha,
                "Usuario",
                usuario.Id,
                $"Pedido de redefinição de senha: {usuario.Email}");
        }
    }
}