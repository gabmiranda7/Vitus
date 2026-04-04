using Vitus.Domain.Entities;

namespace Vitus.Domain.Interfaces
{
    public interface IPacienteRepository
    {
        Task Add(Paciente paciente);
        Task Update(Paciente paciente);
        Task Delete(Paciente paciente);
        Task<Paciente?> GetById(Guid id);
        Task <List<Paciente>> GetAll();
    }
}