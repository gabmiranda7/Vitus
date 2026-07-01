using Vitus.Domain.Entities;

namespace Vitus.Domain.Interfaces
{
    public interface IExameRepository
    {
        Task Add(Exame exame);
        Task<Exame?> GetById(Guid id);
        Task<IList<Exame>> GetByProntuarioId(Guid prontuarioId);
        Task Update(Exame exame);
    }
}