using Vitus.Domain.Entities;

namespace Vitus.Domain.Interfaces
{
    public interface IConsultaAcessoService
    {
        Task GarantirMedicoResponsavel(Consulta consulta);
        Task GarantirResponsavelSeMedico(Consulta consulta);
    }
}