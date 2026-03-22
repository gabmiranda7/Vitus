using Vitus.Domain.Exceptions;

namespace Vitus.Domain.Entities
{
    public class Medico
    {
        public Guid Id { get; private set; }
        public string Nome { get; private set; }
        public string Especialidade { get; private set; }

        protected Medico() { }

        public Medico(string nome, string especialidade)
        {
            Id = Guid.NewGuid();
            DefinirNome(nome);
            DefinirEspecialidade(especialidade);
        }

        public void DefinirNome(string nome)
        {
            if (string.IsNullOrWhiteSpace(nome))
                throw new DomainException("Nome é obrigatório");

            Nome = nome;
        }

        public void DefinirEspecialidade(string especialidade)
        {
            if (string.IsNullOrWhiteSpace(especialidade))
                throw new DomainException("Especialidade é obrigatória");

            Especialidade = especialidade;
        }
    }
}