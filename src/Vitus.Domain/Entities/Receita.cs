using Vitus.Domain.ValueObjects;

namespace Vitus.Domain.Entities
{
    public class Receita
    {
        public Guid Id { get; private set; }
        public Guid ConsultaId { get; private set; }
        public Guid ProntuarioId { get; private set; }

        private readonly List<Medicamento> _medicamentos = new();
        public IReadOnlyCollection<Medicamento> Medicamentos => _medicamentos;

        protected Receita() { }

        public Receita(Guid consultaId, Guid prontuarioId)
        {
            Id = Guid.NewGuid();
            ConsultaId = consultaId;
            ProntuarioId = prontuarioId;
        }

        public void AdicionarMedicamento(string nome, string dosagem, string posologia, string quantidade = "")
        {
            _medicamentos.Add(new Medicamento(nome, dosagem, posologia, quantidade));
        }
    }
}