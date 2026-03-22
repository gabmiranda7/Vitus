using Vitus.Domain.ValueObjects;

namespace Vitus.Domain.Entities
{
    public class Receita
    {
        public Guid Id { get; private set; }
        public Guid ConsultaId { get; private set; }

        private readonly List<Medicamento> _medicamentos = new();
        public IReadOnlyCollection<Medicamento> Medicamentos => _medicamentos;

        protected Receita() { }

        public Receita(Guid consultaId)
        {
            Id = Guid.NewGuid();
            ConsultaId = consultaId;
        }

        public void AdicionarMedicamento(string nome, string dosagem, string posologia)
        {
            _medicamentos.Add(new Medicamento(nome, dosagem, posologia));
        }
    }
}