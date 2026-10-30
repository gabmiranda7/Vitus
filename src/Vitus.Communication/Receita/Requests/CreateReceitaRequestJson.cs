namespace Vitus.Communication.Receita.Requests
{
    public class CreateReceitaRequestJson
    {
        public Guid ConsultaId { get; set; }
        public List<CreateMedicamentoRequestJson> Medicamentos { get; set; }
    }

    public class CreateMedicamentoRequestJson
    {
        public string Nome { get; set; }
        public string Dosagem { get; set; }
        public string Posologia { get; set; }
        public string Quantidade { get; set; } = string.Empty;
        public bool AcompanharVencimento { get; set; }
        public int? ValidadeDias { get; set; }
    }
}