namespace Vitus.Communication.Consulta.Requests
{
    public class CreateConsultaRequestJson
    {
        public Guid PacienteId { get; set; }
        public Guid MedicoId { get; set; }
        public DateTime DataConsulta { get; set; }
    }
}