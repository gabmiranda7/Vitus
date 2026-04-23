using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;

namespace Vitus.Domain.Entities
{
    public class Usuario
    {
        public Guid Id { get; private set; }
        public string Nome { get; private set; }
        public string Email { get; private set; }
        public string SenhaHash { get; private set; }
        public PerfilUsuario Perfil { get; private set; }

        protected Usuario() { }

        public Usuario(string nome, string email, string senhaHash, PerfilUsuario perfil)
        {
            if (string.IsNullOrWhiteSpace(nome))
                throw new DomainException("Nome é obrigatório");

            if (string.IsNullOrWhiteSpace(email))
                throw new DomainException("Email é obrigatório");

            if (string.IsNullOrWhiteSpace(senhaHash))
                throw new DomainException("Senha é obrigatória");

            Id = Guid.NewGuid();
            Nome = nome;
            Email = email;
            SenhaHash = senhaHash;
            Perfil = perfil;
        }
    }
}