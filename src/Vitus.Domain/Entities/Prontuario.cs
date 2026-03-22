namespace Vitus.Domain.Entities
{
    public class Prontuario
    {
        public Guid Id { get; private set; }
        public Guid PacienteId { get; private set; }

        private readonly List<Triagem> _triagens = new();
        public IReadOnlyCollection<Triagem> Triagens => _triagens;

        private readonly List<Consulta> _consultas = new();
        public IReadOnlyCollection<Consulta> Consultas => _consultas;

        private readonly List<Receita> _receitas = new();
        public IReadOnlyCollection<Receita> Receitas => _receitas;

        protected Prontuario() { }

        public Prontuario(Guid pacienteId)
        {
            Id = Guid.NewGuid();
            PacienteId = pacienteId;
        }

        public void AdicionarTriagem(Triagem triagem)
        {
            _triagens.Add(triagem);
        }

        public void AdicionarConsulta(Consulta consulta)
        {
            _consultas.Add(consulta);
        }

        public void AdicionarReceita(Receita receita)
        {
            _receitas.Add(receita);
        }
    }
}