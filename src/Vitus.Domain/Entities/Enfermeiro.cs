using Vitus.Domain.Exceptions;

namespace Vitus.Domain.Entities
{
    public class Enfermeiro
    {
        public Guid Id { get; private set; }
        public string Nome { get; private set; }
        public string COREN { get; private set; }
        public string? Especializacao { get; private set; }

        protected Enfermeiro() { }

        public Enfermeiro(string nome, string coren, string? especializacao)
        {
            if (string.IsNullOrWhiteSpace(nome))
                throw new DomainException("Nome é obrigatório");
            if (string.IsNullOrWhiteSpace(coren))
                throw new DomainException("COREN é obrigatório");

            Id = Guid.NewGuid();
            Nome = nome;
            COREN = coren;
            Especializacao = especializacao;
        }
    }
}