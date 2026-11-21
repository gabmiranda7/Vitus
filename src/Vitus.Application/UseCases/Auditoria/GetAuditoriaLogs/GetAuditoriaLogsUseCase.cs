using Vitus.Communication.Auditoria.Responses;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auditoria.GetAuditoriaLogs
{
    public class GetAuditoriaLogsUseCase
    {
        private readonly IAuditoriaRepository _auditoriaRepository;

        public GetAuditoriaLogsUseCase(IAuditoriaRepository auditoriaRepository)
        {
            _auditoriaRepository = auditoriaRepository;
        }

        public async Task<List<AuditoriaLogResponseJson>> Execute(
            Guid? usuarioId = null,
            string? entidadeAfetada = null,
            DateTime? dataInicio = null,
            DateTime? dataFim = null)
        {
            var logs = await _auditoriaRepository.Buscar(
                usuarioId,
                entidadeAfetada,
                dataInicio?.ToUniversalTime(),
                dataFim?.ToUniversalTime());

            return logs.Select(l => new AuditoriaLogResponseJson
            {
                Id = l.Id,
                UsuarioId = l.UsuarioId,
                UsuarioNome = l.UsuarioNome,
                Acao = l.Acao.ToString(),
                EntidadeAfetada = l.EntidadeAfetada,
                EntidadeId = l.EntidadeId,
                DataHora = l.DataHora,
                Detalhes = l.Detalhes
            }).ToList();
        }
    }
}