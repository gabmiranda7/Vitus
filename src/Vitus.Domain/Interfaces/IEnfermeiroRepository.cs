using Vitus.Domain.Entities;

namespace Vitus.Domain.Interfaces
{
    public interface IEnfermeiroRepository
    {
        Task Add(Enfermeiro enfermeiro);
        Task<List<Enfermeiro>> GetAll();
        Task<Enfermeiro?> GetById(Guid id); 
    }
}