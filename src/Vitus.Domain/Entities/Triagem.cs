namespace Vitus.Domain.Entities
{
    public class Triagem
    {
        public Guid Id { get; private set; }
        public Guid ProntuarioId { get; private set; }

        public string Observacoes { get; private set; }
        public string PressaoArterial { get; private set; }
        public decimal Temperatura { get; private set; }

        protected Triagem() { }

        public Triagem(Guid prontuarioId, string observacoes, string pressaoArterial, decimal temperatura)
        {
            Id = Guid.NewGuid();
            ProntuarioId = prontuarioId;
            Observacoes = observacoes;
            PressaoArterial = pressaoArterial;
            Temperatura = temperatura;
        }
    }
}