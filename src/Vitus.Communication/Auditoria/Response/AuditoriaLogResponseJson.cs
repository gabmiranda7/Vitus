namespace Vitus.Communication.Auditoria.Responses
{
    public class AuditoriaLogResponseJson
    {
        public Guid Id { get; set; }
        public Guid UsuarioId { get; set; }
        public string UsuarioNome { get; set; } = string.Empty;
        public string Acao { get; set; } = string.Empty;
        public string EntidadeAfetada { get; set; } = string.Empty;
        public Guid EntidadeId { get; set; }
        public DateTime DataHora { get; set; }
        public string? Detalhes { get; set; }
    }
}