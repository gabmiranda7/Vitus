using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;

namespace Vitus.Domain.Entities
{
    public class Exame
    {
        public const int MaximoArquivos = 15;

        public Guid Id { get; private set; }
        public Guid ProntuarioId { get; private set; }
        public Prontuario Prontuario { get; private set; } = null!;
        public Guid? ConsultaId { get; private set; }

        public CategoriaExame Categoria { get; private set; }
        public string Nome { get; private set; } = string.Empty;
        public string? Descricao { get; private set; }
        public string MedicoSolicitante { get; private set; } = string.Empty;
        public DateOnly DataExame { get; private set; }
        public string? Observacoes { get; private set; }

        // Legado (retrocompatibilidade com exames já cadastrados)
        public string? CaminhoArquivo { get; private set; }
        public string? NomeArquivoOriginal { get; private set; }

        // Múltiplos arquivos (até 15)
        private readonly List<ExameArquivo> _arquivos = new();
        public IReadOnlyCollection<ExameArquivo> Arquivos => _arquivos.AsReadOnly();

        // Resultado da Análise por IA
        public string? AnaliseIaJson { get; private set; }
        public DateTime? DataAnaliseIa { get; private set; }

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
            if (TotalArquivos() >= MaximoArquivos)
                throw new DomainException($"Limite máximo de {MaximoArquivos} arquivos por exame atingido.");

            // Preenche o legado se for o primeiro, mantendo compatibilidade com endpoints antigos
            if (string.IsNullOrEmpty(CaminhoArquivo))
            {
                CaminhoArquivo = caminhoArquivo;
                NomeArquivoOriginal = nomeArquivoOriginal;
            }

            _arquivos.Add(new ExameArquivo(Id, caminhoArquivo, nomeArquivoOriginal));
        }

        public int TotalArquivos()
        {
            if (_arquivos.Count > 0) return _arquivos.Count;
            return string.IsNullOrEmpty(CaminhoArquivo) ? 0 : 1;
        }

        public void RegistrarAnaliseIa(string analiseIaJson)
        {
            AnaliseIaJson = analiseIaJson;
            DataAnaliseIa = DateTime.UtcNow;
        }
    }
}