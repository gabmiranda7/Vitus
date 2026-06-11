using Vitus.Domain.Entities;
using Vitus.Domain.Enums;

namespace Vitus.Domain.Interfaces
{
    public interface IAuditoriaRepository
    {
        Task Add(AuditoriaLog log);
        Task<List<AuditoriaLog>> GetAll();
        Task<List<AuditoriaLog>> GetByUsuarioId(Guid usuarioId);
        Task<List<AuditoriaLog>> GetByEntidade(string entidadeAfetada, Guid entidadeId);
        Task<List<AuditoriaLog>> GetByPeriodo(DateTime inicio, DateTime fim);
    }
}