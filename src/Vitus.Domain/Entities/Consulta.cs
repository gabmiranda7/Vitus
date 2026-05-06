using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;

namespace Vitus.Domain.Entities
{
    public class Consulta
    {
        public Guid Id { get; private set; }
        public Guid PacienteId { get; private set; }
        public Guid MedicoId { get; private set; }
        public Guid ProntuarioId { get; private set; }
        public DateTime DataConsulta { get; private set; }
        public StatusConsulta Status { get; private set; }
        public string? Anotacoes { get; private set; }

        protected Consulta() { }

        public Consulta(Guid pacienteId, Guid medicoId, Guid prontuarioId, DateTime dataConsulta)
        {
            if (dataConsulta.ToUniversalTime() < DateTime.UtcNow)
                throw new DomainException("Consulta não pode ser no passado");
            Id = Guid.NewGuid();
            PacienteId = pacienteId;
            MedicoId = medicoId;
            ProntuarioId = prontuarioId;
            DataConsulta = dataConsulta.ToUniversalTime();
            Status = StatusConsulta.Agendada;
        }

        public void IniciarTriagem()
        {
            if (Status != StatusConsulta.Agendada)
                throw new DomainException("Consulta não está apta para triagem");
            Status = StatusConsulta.EmTriagem;
        }

        public void AguardarAtendimento()
        {
            if (Status != StatusConsulta.EmTriagem)
                throw new DomainException("Consulta não saiu da triagem");
            Status = StatusConsulta.AguardandoAtendimento;
        }

        public void IniciarAtendimento()
        {
            if (Status != StatusConsulta.AguardandoAtendimento)
                throw new DomainException("Consulta não está pronta para atendimento");
            Status = StatusConsulta.EmAtendimento;
        }

        public void Finalizar()
        {
            if (Status != StatusConsulta.EmAtendimento)
                throw new DomainException("Consulta não pode ser finalizada");
            Status = StatusConsulta.Finalizada;
        }

        public void Cancelar()
        {
            if (Status == StatusConsulta.Finalizada)
                throw new DomainException("Consulta já finalizada não pode ser cancelada");
            Status = StatusConsulta.Cancelada;
        }

        public void Anotar(string anotacoes)
        {
            if (Status != StatusConsulta.EmAtendimento)
                throw new DomainException("Anotações só podem ser feitas durante o atendimento");
            if (string.IsNullOrWhiteSpace(anotacoes))
                throw new DomainException("Anotação não pode ser vazia");
            Anotacoes = anotacoes;
        }
    }
}