using Vitus.Domain.Enums;

namespace Vitus.Domain.Interfaces
{
    public interface IDocumentoService
    {
        Task<byte[]> GerarReceita(
            TipoReceita tipoReceita,
            TipoUso tipoUso,
            string nomePaciente,
            string? enderecoPaciente,
            string nomeMedico,
            string dataReceita,
            List<(string Medicamento, string Posologia)> medicamentos);
    }
}