using Vitus.Domain.Exceptions;

namespace Vitus.Domain.Entities
{
    public class Paciente
    {
        public Guid Id { get; private set; }
        public string Nome { get; private set; }

        public Prontuario Prontuario { get; private set; }

        protected Paciente() { }

        public Paciente(string nome)
        {
            Id = Guid.NewGuid();
            DefinirNome(nome);
        }

        public void DefinirNome(string nome)
        {
            if (string.IsNullOrWhiteSpace(nome))
                throw new DomainException("Nome é obrigatório");

            Nome = nome;
        }

        public void CriarProntuario()
        {
            if (Prontuario != null)
                throw new DomainException("Paciente já possui prontuário");

            Prontuario = new Prontuario(Id);
        }
    }
}