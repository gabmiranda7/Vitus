using System.Text;
using System.Text.RegularExpressions;
using Vitus.Application.UseCases.Exames.RegistrarExame;
using Vitus.Communication.Exame.Responses;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Exames.AnalisarExameIa
{
    public partial class AnalisarExameIaUseCase
    {
        private readonly IExameRepository _exameRepository;
        private readonly IProntuarioRepository _prontuarioRepository;
        private readonly IPacienteRepository _pacienteRepository;
        private readonly IArquivoService _arquivoService;
        private readonly IAnalisadorExameIaService _analisadorIaService;
        private readonly IAuditoriaService _auditoriaService;
        private readonly IConsultaRepository _consultaRepository;
        private readonly IConsultaAcessoService _acessoService;

        public AnalisarExameIaUseCase(
            IExameRepository exameRepository,
            IProntuarioRepository prontuarioRepository,
            IPacienteRepository pacienteRepository,
            IArquivoService arquivoService,
            IAnalisadorExameIaService analisadorIaService,
            IAuditoriaService auditoriaService,
            IConsultaRepository consultaRepository,
            IConsultaAcessoService acessoService)
        {
            _consultaRepository = consultaRepository;
            _acessoService = acessoService;
            _exameRepository = exameRepository;
            _prontuarioRepository = prontuarioRepository;
            _pacienteRepository = pacienteRepository;
            _arquivoService = arquivoService;
            _analisadorIaService = analisadorIaService;
            _auditoriaService = auditoriaService;
        }

        public async Task<ExameResponseJson> Execute(Guid exameId, CancellationToken ct = default)
        {
            var exame = await _exameRepository.GetById(exameId);
            if (exame == null)
                throw new DomainException("Exame não encontrado");

            if (exame.ConsultaId.HasValue)
            {
                var consulta = await _consultaRepository.GetById(exame.ConsultaId.Value);

                // exames.consulta_id não tem chave estrangeira: sem a consulta não há responsável a conferir
                if (consulta != null)
                    await _acessoService.GarantirMedicoResponsavel(consulta);
            }

            var listaArquivos = ObterListaArquivos(exame);
            if (listaArquivos.Count == 0)
                throw new DomainException("Anexe ao menos um arquivo antes de solicitar a análise por IA");

            if (listaArquivos.Count > Exame.MaximoArquivos)
                throw new DomainException($"Limite máximo de {Exame.MaximoArquivos} arquivos por análise");

            var inputsIa = new List<ArquivoExameIaInput>();
            foreach (var (caminho, nomeOriginal) in listaArquivos.Take(Exame.MaximoArquivos))
            {
                var bytes = await _arquivoService.Ler(caminho);
                var contentType = ObterContentType(nomeOriginal);
                inputsIa.Add(new ArquivoExameIaInput(bytes, contentType, nomeOriginal));
            }

            // Carrega apenas dados clínicos anônimos do paciente (sem nome, CPF ou Cartão SUS)
            Paciente? paciente = null;
            var prontuario = await _prontuarioRepository.GetById(exame.ProntuarioId);
            if (prontuario != null)
                paciente = await _pacienteRepository.GetById(prontuario.PacienteId);

            var contextoAnonimo = MontarContextoAnonimo(exame, paciente);

            var analiseJson = await _analisadorIaService.AnalisarExamesAsync(inputsIa, contextoAnonimo, ct);

            exame.RegistrarAnaliseIa(analiseJson);
            await _exameRepository.Update(exame);

            await _auditoriaService.Registrar(
                AcaoAuditoria.AnaliseIaExame,
                "Exame",
                exame.Id,
                $"Prontuário {exame.ProntuarioId} ({inputsIa.Count} arquivo(s))");

            return RegistrarExameUseCase.MapToResponse(exame);
        }

        private static List<(string Caminho, string NomeOriginal)> ObterListaArquivos(Exame exame)
        {
            if (exame.Arquivos.Count > 0)
            {
                return exame.Arquivos
                    .OrderBy(a => a.DataUpload)
                    .Select(a => (a.CaminhoArquivo, a.NomeArquivoOriginal))
                    .ToList();
            }

            if (!string.IsNullOrEmpty(exame.CaminhoArquivo))
                return new List<(string, string)> { (exame.CaminhoArquivo, exame.NomeArquivoOriginal ?? "exame.pdf") };

            return new List<(string, string)>();
        }

        private static string ObterContentType(string nomeArquivo)
        {
            return Path.GetExtension(nomeArquivo).ToLowerInvariant() switch
            {
                ".pdf" => "application/pdf",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                _ => "application/octet-stream"
            };
        }

        private static string MontarContextoAnonimo(Exame exame, Paciente? paciente)
        {
            var sb = new StringBuilder();
            sb.AppendLine($"Exame: {exame.Nome} (Categoria: {exame.Categoria})");

            if (!string.IsNullOrWhiteSpace(exame.Descricao))
                sb.AppendLine($"Descrição clínica: {SanitizarTexto(exame.Descricao)}");

            if (!string.IsNullOrWhiteSpace(exame.Observacoes))
                sb.AppendLine($"Observações informadas: {SanitizarTexto(exame.Observacoes)}");

            if (paciente != null)
            {
                if (paciente.DataNascimento.HasValue)
                {
                    var idade = CalcularIdade(paciente.DataNascimento.Value);
                    sb.AppendLine($"Idade do paciente: {idade} anos");
                }

                if (!string.IsNullOrWhiteSpace(paciente.Sexo))
                    sb.AppendLine($"Sexo biológico: {paciente.Sexo}");

                if (!string.IsNullOrWhiteSpace(paciente.InformacoesAdicionais))
                    sb.AppendLine($"Comorbidades / Alergias / Histórico relevante: {SanitizarTexto(paciente.InformacoesAdicionais)}");
            }

            return sb.ToString();
        }

        private static string SanitizarTexto(string texto)
        {
            var limpo = CpfRegex().Replace(texto, "[CPF_OMITIDO]");
            limpo = SusRegex().Replace(limpo, "[CNS_OMITIDO]");
            limpo = EmailRegex().Replace(limpo, "[EMAIL_OMITIDO]");
            limpo = TelefoneRegex().Replace(limpo, "[TELEFONE_OMITIDO]");
            return limpo.Trim();
        }

        private static int CalcularIdade(DateOnly nascimento)
        {
            var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
            var idade = hoje.Year - nascimento.Year;
            if (hoje < nascimento.AddYears(idade)) idade--;
            return Math.Max(0, idade);
        }

        [GeneratedRegex(@"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b")]
        private static partial Regex CpfRegex();

        [GeneratedRegex(@"\b\d{3}\.?\d{4}\.?\d{4}\.?\d{4}\b")]
        private static partial Regex SusRegex();

        [GeneratedRegex(@"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")]
        private static partial Regex EmailRegex();

        [GeneratedRegex(@"\(?\d{2}\)?\s?9?\d{4}-?\d{4}")]
        private static partial Regex TelefoneRegex();
    }
}