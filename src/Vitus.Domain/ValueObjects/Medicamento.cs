using Vitus.Domain.Exceptions;

namespace Vitus.Domain.ValueObjects
{
    public record Medicamento
    {
        public const int ValidadeMaximaDias = 730;

        public string Nome { get; private set; }
        public string Dosagem { get; private set; }
        public string Posologia { get; private set; }
        public string Quantidade { get; private set; }
        public bool AcompanharVencimento { get; private set; }
        public int? ValidadeDias { get; private set; }

        protected Medicamento() { }

        public Medicamento(
            string nome, string dosagem, string posologia, string quantidade = "",
            bool acompanharVencimento = false, int? validadeDias = null)
        {
            if (string.IsNullOrWhiteSpace(nome))
                throw new DomainException("Nome do medicamento é obrigatório");

            if (acompanharVencimento && (validadeDias is null or < 1 or > ValidadeMaximaDias))
                throw new DomainException($"A validade deve ficar entre 1 e {ValidadeMaximaDias} dias");

            Nome = nome;
            Dosagem = dosagem;
            Posologia = posologia;
            Quantidade = quantidade;
            AcompanharVencimento = acompanharVencimento;
            ValidadeDias = acompanharVencimento ? validadeDias : null;
        }
    }
}