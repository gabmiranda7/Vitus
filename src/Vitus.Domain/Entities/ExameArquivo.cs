namespace Vitus.Domain.Entities
{
    public class ExameArquivo
    {
        public Guid Id { get; private set; }
        public Guid ExameId { get; private set; }
        public Exame Exame { get; private set; } = null!;

        public string CaminhoArquivo { get; private set; } = string.Empty;
        public string NomeArquivoOriginal { get; private set; } = string.Empty;
        public DateTime DataUpload { get; private set; }

        protected ExameArquivo() { }

        public ExameArquivo(Guid exameId, string caminhoArquivo, string nomeArquivoOriginal)
        {
            Id = Guid.NewGuid();
            ExameId = exameId;
            CaminhoArquivo = caminhoArquivo;
            NomeArquivoOriginal = nomeArquivoOriginal;
            DataUpload = DateTime.UtcNow;
        }
    }
}