using Vitus.Domain.Entities;

namespace Vitus.Domain.Interfaces
{
    public interface ITriagemRepository
    {
        Task Add(Triagem triagem);
        Task<Triagem?> GetById(Guid id);
        Task<List<Triagem>> GetAll();
    }
}