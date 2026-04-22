using Vitus.Domain.Entities;

namespace Vitus.Domain.Interfaces
{
    public interface IReceitaRepository
    {
        Task Add(Receita receita);
        Task<Receita?> GetById(Guid id);
        Task<List<Receita>> GetAll();
    }
}