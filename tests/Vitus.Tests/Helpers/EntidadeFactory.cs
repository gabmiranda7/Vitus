using Vitus.Domain.Entities;

namespace Vitus.Tests.Helpers
{
    public static class EntidadeFactory
    {
        public static Paciente CriarPaciente(string nome = "João Silva") =>
            new Paciente(nome, null, null, null, null, null, null, null, null, null, null, true);

        public static Medico CriarMedico(string nome = "Dr. Carlos", string especialidade = "Cardiologia", string crm = "CRM-MG 12345") =>
            new Medico(nome, especialidade, crm);

        public static Consulta CriarConsulta(Guid? pacienteId = null, Guid? medicoId = null, Guid? prontuarioId = null) =>
            new Consulta(
                pacienteId ?? Guid.NewGuid(),
                medicoId ?? Guid.NewGuid(),
                prontuarioId ?? Guid.NewGuid(),
                DateTime.UtcNow.AddHours(2)
            );
    }
}