using Vitus.Domain.Enums;

namespace Vitus.Domain.Interfaces
{
    public interface IAuditoriaService
    {
        Task Registrar(AcaoAuditoria acao, string entidadeAfetada, Guid entidadeId, string? detalhes = null);
        Task RegistrarComo(Guid usuarioId, string usuarioNome, AcaoAuditoria acao, string entidadeAfetada, Guid entidadeId, string? detalhes = null);
    }
}