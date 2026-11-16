using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.AlterarStatusUsuario
{
    public class AlterarStatusUsuarioUseCase
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IAuditoriaService _auditoriaService;

        public AlterarStatusUsuarioUseCase(
            IUsuarioRepository usuarioRepository,
            IAuditoriaService auditoriaService)
        {
            _usuarioRepository = usuarioRepository;
            _auditoriaService = auditoriaService;
        }

        public async Task Execute(Guid id, bool ativar)
        {
            var usuario = await _usuarioRepository.GetById(id);

            if (usuario == null)
                throw new DomainException("Usuário não encontrado");

            if (ativar)
                usuario.Reativar();
            else
                usuario.Desativar();

            await _usuarioRepository.Update(usuario);

            var acaoTexto = ativar ? "Reativação de acesso" : "Desativação de acesso";
            await _auditoriaService.Registrar(
                AcaoAuditoria.AtualizacaoPerfil,
                "Usuario",
                usuario.Id,
                $"{acaoTexto}: {usuario.Nome} ({usuario.Perfil})"
            );
        }
    }
}