namespace Vitus.Communication.Triagem.Requests
{
    public class CreateTriagemRequestJson
    {
        public Guid ConsultaId { get; set; }
        public string Observacoes { get; set; }
        public string PressaoArterial { get; set; }
        public decimal Temperatura { get; set; }
    }
}