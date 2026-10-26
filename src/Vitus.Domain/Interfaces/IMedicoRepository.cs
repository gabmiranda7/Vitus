using Vitus.Domain.Entities;

namespace Vitus.Domain.Interfaces
{
    public interface IMedicoRepository
    {
        Task Add(Medico medico);
        Task<Medico?> GetById(Guid id);
        Task<Medico?> GetByUsuarioId(Guid usuarioId);
        Task<List<Medico>> GetAll();
    }
}