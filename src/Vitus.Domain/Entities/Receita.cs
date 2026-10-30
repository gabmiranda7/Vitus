using Vitus.Domain.ValueObjects;

namespace Vitus.Domain.Entities
{
    public class Receita
    {
        public Guid Id { get; private set; }
        public Guid ConsultaId { get; private set; }
        public Guid ProntuarioId { get; private set; }
        public DateTime DataEmissao { get; private set; }

        private readonly List<Medicamento> _medicamentos = new();
        public IReadOnlyCollection<Medicamento> Medicamentos => _medicamentos;

        protected Receita() { }

        public Receita(Guid consultaId, Guid prontuarioId, DateTime? dataEmissao = null)
        {
            Id = Guid.NewGuid();
            ConsultaId = consultaId;
            ProntuarioId = prontuarioId;
            DataEmissao = dataEmissao ?? DateTime.UtcNow;
        }

        public void AdicionarMedicamento(
            string nome, string dosagem, string posologia, string quantidade = "",
            bool acompanharVencimento = false, int? validadeDias = null)
        {
            _medicamentos.Add(new Medicamento(nome, dosagem, posologia, quantidade, acompanharVencimento, validadeDias));
        }
    }
}