namespace Vitus.Communication.Receita.Requests
{
    public class GerarReceitaRequestJson
    {
        public Guid ConsultaId { get; set; }
        public string TipoReceita { get; set; } = string.Empty;
        public string TipoUso { get; set; } = string.Empty;
        public List<MedicamentoRequestJson> Medicamentos { get; set; } = new();
    }

    public class MedicamentoRequestJson
    {
        public string Nome { get; set; } = string.Empty;
        public string Dosagem { get; set; } = string.Empty;
        public string Posologia { get; set; } = string.Empty;
        public string Quantidade { get; set; } = string.Empty;
    }
}