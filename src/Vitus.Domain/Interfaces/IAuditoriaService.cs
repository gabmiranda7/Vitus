using Vitus.Domain.Enums;

namespace Vitus.Domain.Services
{
    public interface IAuditoriaService
    {
        Task Registrar(AcaoAuditoria acao, string entidadeAfetada, Guid entidadeId, string? detalhes = null);
    }
}