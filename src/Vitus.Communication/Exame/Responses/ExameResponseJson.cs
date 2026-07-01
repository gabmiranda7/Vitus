namespace Vitus.Communication.Exame.Responses
{
    public class ExameResponseJson
    {
        public Guid Id { get; set; }
        public Guid ProntuarioId { get; set; }
        public Guid? ConsultaId { get; set; }
        public string Categoria { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public string MedicoSolicitante { get; set; } = string.Empty;
        public DateOnly DataExame { get; set; }
        public string? Observacoes { get; set; }
        public string? NomeArquivoOriginal { get; set; }
        public bool TemArquivo { get; set; }
    }
}