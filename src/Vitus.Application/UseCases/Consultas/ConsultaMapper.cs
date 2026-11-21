using Vitus.Communication.Consulta.Responses;
using Vitus.Domain.Entities;

namespace Vitus.Application.UseCases.Consultas
{
    public static class ConsultaMapper
    {
        public static ConsultaResponseJson ToResponse(Consulta consulta, Paciente paciente, Medico medico) => new()
        {
            Id = consulta.Id,
            PacienteId = consulta.PacienteId,
            MedicoId = consulta.MedicoId,
            DataConsulta = consulta.DataConsulta,
            Status = consulta.Status.ToString(),
            NomePaciente = paciente.Nome,
            NomeMedico = medico.Nome,
            Anotacoes = consulta.Anotacoes
        };
    }
}