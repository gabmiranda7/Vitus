using Vitus.Domain.Entities;

namespace Vitus.Domain.Interfaces
{
    public interface IPacienteRepository
    {
        Task Add(Paciente paciente);
    }
}