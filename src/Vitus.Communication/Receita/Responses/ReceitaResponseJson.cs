namespace Vitus.Communication.Receita.Responses
{
    public class ReceitaResponseJson
    {
        public Guid Id { get; set; }
        public Guid ConsultaId { get; set; }
        public DateTime DataEmissao { get; set; }
        public List<MedicamentoResponseJson> Medicamentos { get; set; }
    }

    public class MedicamentoResponseJson
    {
        public string Nome { get; set; }
        public string Dosagem { get; set; }
        public string Posologia { get; set; }
        public string Quantidade { get; set; } = string.Empty;
        public bool AcompanharVencimento { get; set; }
        public int? ValidadeDias { get; set; }
    }
}