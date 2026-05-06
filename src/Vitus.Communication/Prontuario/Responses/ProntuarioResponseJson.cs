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
    }
}