namespace Vitus.Communication.Receita.Requests
{
    public class GerarReceitaRequestJson
    {
        public Guid ConsultaId { get; set; }
        public string TipoReceita { get; set; } = string.Empty;
        public string TipoUso { get; set; } = string.Empty;
        public List<CreateMedicamentoRequestJson> Medicamentos { get; set; } = new();
    }
}