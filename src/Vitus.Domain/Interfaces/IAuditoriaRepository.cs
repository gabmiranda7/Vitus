using Vitus.Domain.Entities;

namespace Vitus.Domain.Interfaces
{
    public interface IAuditoriaRepository
    {
        Task Add(AuditoriaLog log);
        Task<List<AuditoriaLog>> GetAll();
        Task<List<AuditoriaLog>> GetByUsuarioId(Guid usuarioId);
        Task<List<AuditoriaLog>> GetByEntidade(string entidadeAfetada, Guid entidadeId);
        Task<List<AuditoriaLog>> GetByPeriodo(DateTime inicio, DateTime fim);
        Task<List<AuditoriaLog>> Buscar(Guid? usuarioId, string? entidadeAfetada, DateTime? inicio, DateTime? fim);
    }
}