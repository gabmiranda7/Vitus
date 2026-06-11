using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Interfaces;
using Vitus.Domain.Services;

namespace Vitus.Infrastructure.Services
{
    public class AuditoriaService : IAuditoriaService
    {
        private readonly IAuditoriaRepository _auditoriaRepository;
        private readonly IUsuarioContexto _usuarioContexto;

        public AuditoriaService(IAuditoriaRepository auditoriaRepository, IUsuarioContexto usuarioContexto)
        {
            _auditoriaRepository = auditoriaRepository;
            _usuarioContexto = usuarioContexto;
        }

        public async Task Registrar(AcaoAuditoria acao, string entidadeAfetada, Guid entidadeId, string? detalhes = null)
        {
            var log = new AuditoriaLog(
                _usuarioContexto.UsuarioId,
                _usuarioContexto.UsuarioNome,
                acao,
                entidadeAfetada,
                entidadeId,
                detalhes
            );

            await _auditoriaRepository.Add(log);
        }
    }
}