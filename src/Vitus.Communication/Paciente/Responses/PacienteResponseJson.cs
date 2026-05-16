namespace Vitus.Communication.Paciente.Responses
{
    public class PacienteResponseJson
    {
        public Guid Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Cpf { get; set; }
        public string? CartaoSus { get; set; }
        public DateOnly? DataNascimento { get; set; }
        public string? Sexo { get; set; }
        public string? NomePai { get; set; }
        public string? NomeMae { get; set; }
        public string? Endereco { get; set; }
        public string? Profissao { get; set; }
        public string? EstadoCivil { get; set; }
        public string? InformacoesAdicionais { get; set; }
        public bool AceitaTermos { get; set; }
    }
}