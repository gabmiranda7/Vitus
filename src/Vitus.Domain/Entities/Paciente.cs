using Vitus.Domain.Exceptions;

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

        public Prontuario Prontuario { get; private set; }

        protected Paciente() { }

        public Paciente(string nome, string? cpf, string? cartaoSus, DateOnly? dataNascimento,
            string? sexo, string? nomePai, string? nomeMae, string? endereco,
            string? profissao, string? estadoCivil, string? informacoesAdicionais, bool aceitaTermos)
        {
            Id = Guid.NewGuid();
            DefinirNome(nome);
            Cpf = cpf;
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
            DefinirNome(nome);
            Cpf = cpf;
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

        public void CriarProntuario()
        {
            if (Prontuario != null)
                throw new DomainException("Paciente já possui prontuário");
            Prontuario = new Prontuario(Id);
        }
    }
}