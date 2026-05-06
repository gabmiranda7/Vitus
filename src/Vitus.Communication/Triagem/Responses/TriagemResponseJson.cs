namespace Vitus.Communication.Triagem.Responses
{
    public class TriagemResponseJson
    {
        public Guid Id { get; set; }
        public Guid ProntuarioId { get; set; }
        public string Observacoes { get; set; }
        public string PressaoArterial { get; set; }
        public decimal Temperatura { get; set; }
        public string NomeEnfermeiro { get; set; }
    }
}