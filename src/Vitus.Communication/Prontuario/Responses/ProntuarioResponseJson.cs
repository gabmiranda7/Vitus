using Vitus.Communication.Consulta.Responses;
using Vitus.Communication.Receita.Responses;
using Vitus.Communication.Triagem.Responses;

namespace Vitus.Communication.Prontuario.Responses
{
    public class ProntuarioResponseJson
    {
        public Guid Id { get; set; }
        public Guid PacienteId { get; set; }
        public List<TriagemResponseJson> Triagens { get; set; }
        public List<ConsultaResponseJson> Consultas { get; set; }
        public List<ReceitaResponseJson> Receitas { get; set; }
        public List<ConsultaResponseJson> Anotacoes { get; set; }
        public List<TratamentoAcompanhadoResponseJson> Tratamentos { get; set; } = new();
    }

    public class TratamentoAcompanhadoResponseJson
    {
        public string Medicamento { get; set; } = string.Empty;
        public Guid ReceitaId { get; set; }
        public DateTime DataEmissao { get; set; }
        public int ValidadeDias { get; set; }
        public DateOnly DataVencimento { get; set; }
        public int DiasRestantes { get; set; }
    }
}