using Vitus.Domain.Exceptions;
using Vitus.Domain.ValueObjects;

namespace Vitus.Domain.Entities
{
    public class Paciente
    {
        public Guid Id { get; private set; }
        public string Nome { get; private set; }
        public string? Cpf { get; private set; }
        public string? CartaoSus { get; private set; }
        public DateOnly? DataNascimento { get; private set; }
        public string? Sexo { get; private set; }
        public string? NomePai { get; private set; }
        public string? NomeMae { get; private set; }
        public string? Endereco { get; private set; }
        public string? Profissao { get; private set; }
        public string? EstadoCivil { get; private set; }
        public string? InformacoesAdicionais { get; private set; }
        public bool AceitaTermos { get; private set; }
        public bool Ativo { get; private set; } = true;

        public Prontuario Prontuario { get; private set; }

        protected Paciente() { }

        public Paciente(string nome, string? cpf, string? cartaoSus, DateOnly? dataNascimento,
            string? sexo, string? nomePai, string? nomeMae, string? endereco,
            string? profissao, string? estadoCivil, string? informacoesAdicionais, bool aceitaTermos)
        {
            if (!aceitaTermos)
                throw new DomainException("O paciente precisa aceitar os termos de uso de dados");

            Id = Guid.NewGuid();
            Ativo = true;
            DefinirNome(nome);
            DefinirCpf(cpf);
            CartaoSus = cartaoSus;
            DataNascimento = dataNascimento;
            Sexo = sexo;
            NomePai = nomePai;
            NomeMae = nomeMae;
            Endereco = endereco;
            Profissao = profissao;
            EstadoCivil = estadoCivil;
            InformacoesAdicionais = informacoesAdicionais;
            AceitaTermos = aceitaTermos;
        }

        public void DefinirNome(string nome)
        {
            if (string.IsNullOrWhiteSpace(nome))
                throw new DomainException("Nome é obrigatório");
            Nome = nome;
        }

        public void Atualizar(string nome, string? cpf, string? cartaoSus, DateOnly? dataNascimento,
            string? sexo, string? nomePai, string? nomeMae, string? endereco,
            string? profissao, string? estadoCivil, string? informacoesAdicionais)
        {
            if (!Ativo)
                throw new DomainException("Paciente inativo não pode ser editado. Reative o cadastro primeiro");

            DefinirNome(nome);
            DefinirCpf(cpf);
            CartaoSus = cartaoSus;
            DataNascimento = dataNascimento;
            Sexo = sexo;
            NomePai = nomePai;
            NomeMae = nomeMae;
            Endereco = endereco;
            Profissao = profissao;
            EstadoCivil = estadoCivil;
            InformacoesAdicionais = informacoesAdicionais;
        }

        public void Inativar()
        {
            if (!Ativo)
                throw new DomainException("Paciente já está inativo");

            Ativo = false;
        }

        public void Reativar()
        {
            if (Ativo)
                throw new DomainException("Paciente já está ativo");

            Ativo = true;
        }

        public void CriarProntuario()
        {
            if (Prontuario != null)
                throw new DomainException("Paciente já possui prontuário");
            Prontuario = new Prontuario(Id);
        }

        private void DefinirCpf(string? cpf)
        {
            // Um CPF legado igual ao já gravado é mantido, para não bloquear a edição dos outros campos
            if (Cpf != null && CpfBrasileiro.SomenteDigitos(cpf) == CpfBrasileiro.SomenteDigitos(Cpf))
                return;

            Cpf = CpfBrasileiro.Normalizar(cpf);
        }
    }
}