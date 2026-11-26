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
        public StatusUsuario Status { get; private set; }
        public string? FotoCaminho { get; private set; }

        // Troca obrigatória após a redefinição feita pelo administrador
        public bool DeveTrocarSenha { get; private set; }
        public DateTime? RedefinicaoSolicitadaEm { get; private set; }
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
            Status = perfil == PerfilUsuario.Administrador
                ? StatusUsuario.Aprovado
                : StatusUsuario.Pendente;
        }

        public void Aprovar()
        {
            if (Status != StatusUsuario.Pendente)
                throw new DomainException("Apenas cadastros pendentes podem ser aprovados");

            Status = StatusUsuario.Aprovado;
        }

        public void Recusar()
        {
            if (Status != StatusUsuario.Pendente)
                throw new DomainException("Apenas cadastros pendentes podem ser recusados");

            Status = StatusUsuario.Recusado;
        }

        public void Desativar()
        {
            if (Perfil == PerfilUsuario.Administrador)
                throw new DomainException("Não é possível desativar uma conta de Administrador");

            if (Status != StatusUsuario.Aprovado)
                throw new DomainException("Apenas usuários ativos podem ser desativados");

            Status = StatusUsuario.Inativo;
        }

        public void Reativar()
        {
            if (Status != StatusUsuario.Inativo)
                throw new DomainException("Apenas usuários inativos podem ser reativados");

            Status = StatusUsuario.Aprovado;
        }

        public void AlterarNome(string nome)
        {
            if (string.IsNullOrWhiteSpace(nome))
                throw new DomainException("Nome é obrigatório");

            Nome = nome.Trim();
        }

        public void DefinirFoto(string caminho)
        {
            if (string.IsNullOrWhiteSpace(caminho))
                throw new DomainException("Caminho da foto é obrigatório");

            FotoCaminho = caminho;
        }

        public void RemoverFoto() => FotoCaminho = null;

        /// <summary>Registra que o usuário pediu ajuda para redefinir a senha (só contas ativas).</summary>
        public void SolicitarRedefinicaoSenha()
        {
            if (Status != StatusUsuario.Aprovado)
                return;

            RedefinicaoSolicitadaEm = DateTime.UtcNow;
        }

        /// <summary>Define uma senha temporária; o usuário precisará trocá-la no próximo acesso.</summary>
        public void RedefinirComSenhaTemporaria(string senhaHash)
        {
            if (string.IsNullOrWhiteSpace(senhaHash))
                throw new DomainException("Senha é obrigatória");

            if (Status != StatusUsuario.Aprovado)
                throw new DomainException("Apenas usuários ativos podem ter a senha redefinida");

            SenhaHash = senhaHash;
            DeveTrocarSenha = true;
            RedefinicaoSolicitadaEm = null;
        }

        /// <summary>Define a senha escolhida pelo próprio usuário e encerra a troca obrigatória.</summary>
        public void DefinirNovaSenha(string senhaHash)
        {
            if (string.IsNullOrWhiteSpace(senhaHash))
                throw new DomainException("Senha é obrigatória");

            SenhaHash = senhaHash;
            DeveTrocarSenha = false;
            RedefinicaoSolicitadaEm = null;
        }
    }
}