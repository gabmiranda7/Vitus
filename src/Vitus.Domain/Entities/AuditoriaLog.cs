using Vitus.Domain.Enums;

namespace Vitus.Domain.Entities
{
    public class AuditoriaLog
    {
        public Guid Id { get; private set; }
        public Guid UsuarioId { get; private set; }
        public string UsuarioNome { get; private set; }
        public AcaoAuditoria Acao { get; private set; }
        public string EntidadeAfetada { get; private set; }
        public Guid EntidadeId { get; private set; }
        public DateTime DataHora { get; private set; }
        public string? Detalhes { get; private set; }

        protected AuditoriaLog() { }

        public AuditoriaLog(Guid usuarioId, string usuarioNome, AcaoAuditoria acao, string entidadeAfetada, Guid entidadeId, string? detalhes = null)
        {
            Id = Guid.NewGuid();
            UsuarioId = usuarioId;
            UsuarioNome = usuarioNome;
            Acao = acao;
            EntidadeAfetada = entidadeAfetada;
            EntidadeId = entidadeId;
            DataHora = DateTime.UtcNow;
            Detalhes = detalhes;
        }
    }
}