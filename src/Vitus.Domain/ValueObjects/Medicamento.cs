using Vitus.Domain.Exceptions;

namespace Vitus.Domain.ValueObjects
{
    public record Medicamento
    {
        public string Nome { get; private set; }
        public string Dosagem { get; private set; }
        public string Posologia { get; private set; }
        public string Quantidade { get; private set; }

        protected Medicamento() { }

        public Medicamento(string nome, string dosagem, string posologia, string quantidade = "")
        {
            if (string.IsNullOrWhiteSpace(nome))
                throw new DomainException("Nome do medicamento é obrigatório");

            Nome = nome;
            Dosagem = dosagem;
            Posologia = posologia;
            Quantidade = quantidade;
        }
    }
}