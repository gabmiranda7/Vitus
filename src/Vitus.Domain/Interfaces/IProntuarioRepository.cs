using Vitus.Domain.Entities;

namespace Vitus.Domain.Interfaces
{
    public interface IProntuarioRepository
    {
        Task<Prontuario?> GetById(Guid id);
        Task<Prontuario?> GetByPacienteId(Guid pacienteId);
    }
}