namespace Vitus.Communication.Prontuario.Responses
{
    public class AcompanhamentoPacienteResponseJson
    {
        public Guid PacienteId { get; set; }
        public Guid ProntuarioId { get; set; }
        public List<TratamentoAcompanhadoResponseJson> Tratamentos { get; set; } = new();
    }
}