using Vitus.Domain.Entities;

namespace Vitus.Domain.Interfaces
{
    public interface IConsultaRepository
    {
        Task Add(Consulta consulta);
    }
}