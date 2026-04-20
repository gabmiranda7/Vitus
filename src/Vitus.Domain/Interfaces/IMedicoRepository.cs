using Vitus.Domain.Entities;

namespace Vitus.Domain.Interfaces
{
    public interface IMedicoRepository
    {
        Task Add(Medico medico);
        Task<Medico?> GetById(Guid id);
        Task<List<Medico>> GetAll();
    }
}