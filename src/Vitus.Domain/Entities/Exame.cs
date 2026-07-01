using Vitus.Domain.Enums;

namespace Vitus.Domain.Entities
{
    public class Exame
    {
        public Guid Id { get; private set; }
        public Guid ProntuarioId { get; private set; }
        public Prontuario Prontuario { get; private set; }
        public Guid? ConsultaId { get; private set; }

        public CategoriaExame Categoria { get; private set; }
        public string Nome { get; private set; }
        public string? Descricao { get; private set; }
        public string MedicoSolicitante { get; private set; }
        public DateOnly DataExame { get; private set; }
        public string? Observacoes { get; private set; }

        public string? CaminhoArquivo { get; private set; }
        public string? NomeArquivoOriginal { get; private set; }

        protected Exame() { }

        public Exame(
            Guid prontuarioId,
            Guid? consultaId,
            CategoriaExame categoria,
            string nome,
            string? descricao,
            string medicoSolicitante,
            DateOnly dataExame,
            string? observacoes)
        {
            Id = Guid.NewGuid();
            ProntuarioId = prontuarioId;
            ConsultaId = consultaId;
            Categoria = categoria;
            Nome = nome;
            Descricao = descricao;
            MedicoSolicitante = medicoSolicitante;
            DataExame = dataExame;
            Observacoes = observacoes;
        }

        public void AnexarArquivo(string caminhoArquivo, string nomeArquivoOriginal)
        {
            CaminhoArquivo = caminhoArquivo;
            NomeArquivoOriginal = nomeArquivoOriginal;
        }
    }
}