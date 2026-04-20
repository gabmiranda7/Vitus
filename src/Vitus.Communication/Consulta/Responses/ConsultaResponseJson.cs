namespace Vitus.Communication.Consulta.Responses
{
    public class ConsultaResponseJson
    {
        public Guid Id { get; set; }
        public DateTime DataConsulta { get; set; }
        public string Status { get; set; }
        public string NomePaciente { get; set; }
        public string NomeMedico { get; set; }
    }
}