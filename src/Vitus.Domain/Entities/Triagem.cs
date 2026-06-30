namespace Vitus.Domain.Entities
{
    public class Triagem
    {
        public Guid Id { get; private set; }
        public Guid ProntuarioId { get; private set; }
        public Prontuario Prontuario { get; private set; }
        public Guid ConsultaId { get; private set; }
        public string Observacoes { get; private set; }
        public string PressaoArterial { get; private set; }
        public decimal Temperatura { get; private set; }
        public string NomeEnfermeiro { get; private set; }

        protected Triagem() { }

        public Triagem(Guid prontuarioId, Guid consultaId, string observacoes, string pressaoArterial, decimal temperatura, string nomeEnfermeiro)
        {
            Id = Guid.NewGuid();
            ConsultaId = consultaId;
            ProntuarioId = prontuarioId;
            Observacoes = observacoes;
            PressaoArterial = pressaoArterial;
            Temperatura = temperatura;
            NomeEnfermeiro = nomeEnfermeiro;
        }
    }
}