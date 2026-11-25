using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Vitus.Application.UseCases.Exames.RegistrarExame;
using Vitus.Communication.Exame.Responses;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Exames.AnalisarExameIa
{
    public class AnalisarExameIaUseCase
    {
        private const int MaximoCaracteresPorDocumento = 50_000;

        private readonly IExameRepository _exameRepository;
        private readonly IProntuarioRepository _prontuarioRepository;
        private readonly IPacienteRepository _pacienteRepository;
        private readonly IArquivoService _arquivoService;
        private readonly IExtratorTextoPdf _extratorTexto;
        private readonly IAnalisadorExameIaService _analisadorIaService;
        private readonly IAuditoriaService _auditoriaService;
        private readonly IConsultaRepository _consultaRepository;
        private readonly IConsultaAcessoService _acessoService;
        private readonly IUsuarioContexto _usuarioContexto;

        public AnalisarExameIaUseCase(
            IExameRepository exameRepository,
            IProntuarioRepository prontuarioRepository,
            IPacienteRepository pacienteRepository,
            IArquivoService arquivoService,
            IExtratorTextoPdf extratorTexto,
            IAnalisadorExameIaService analisadorIaService,
            IAuditoriaService auditoriaService,
            IConsultaRepository consultaRepository,
            IConsultaAcessoService acessoService,
            IUsuarioContexto usuarioContexto)
        {
            _usuarioContexto = usuarioContexto;
            _consultaRepository = consultaRepository;
            _acessoService = acessoService;
            _exameRepository = exameRepository;
            _prontuarioRepository = prontuarioRepository;
            _pacienteRepository = pacienteRepository;
            _arquivoService = arquivoService;
            _extratorTexto = extratorTexto;
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

            // Os dados do paciente são necessários para saber o que remover do texto
            var prontuario = await _prontuarioRepository.GetById(exame.ProntuarioId);
            var paciente = prontuario != null
                ? await _pacienteRepository.GetById(prontuario.PacienteId)
                : null;

            if (paciente == null)
                throw new DomainException("Paciente do exame não encontrado");

            var identificadores = new IdentificadoresPaciente(
                paciente.Nome, paciente.NomeMae, paciente.NomePai, paciente.Endereco, paciente.DataNascimento);

            var documentos = new List<DocumentoExameIaInput>();
            var ignorados = 0;

            foreach (var (caminho, nomeOriginal) in listaArquivos)
            {
                // Só PDFs com texto selecionável: em imagens não há como remover dados pessoais
                if (!string.Equals(Path.GetExtension(nomeOriginal), ".pdf", StringComparison.OrdinalIgnoreCase))
                {
                    ignorados++;
                    continue;
                }

                var bytes = await _arquivoService.Ler(caminho);
                var texto = _extratorTexto.ExtrairTexto(bytes);

                if (string.IsNullOrWhiteSpace(texto))
                {
                    ignorados++;
                    continue;
                }

                var limpo = AnonimizadorDeTexto.Anonimizar(texto, identificadores);
                if (limpo.Length > MaximoCaracteresPorDocumento)
                    limpo = limpo[..MaximoCaracteresPorDocumento] + "\n[texto truncado]";

                documentos.Add(new DocumentoExameIaInput(limpo));
            }

            if (documentos.Count == 0)
                throw new DomainException(
                    "A análise por IA só funciona com PDFs que tenham texto selecionável. " +
                    "Imagens e documentos escaneados não são enviados, porque não há como remover os dados pessoais deles");

            var contextoAnonimo = MontarContextoAnonimo(exame, paciente, identificadores, ignorados);

            var analiseJson = await _analisadorIaService.AnalisarExamesAsync(documentos, contextoAnonimo, ct);

            // Guarda quem gerou a análise dentro do próprio JSON (sem precisar de nova coluna)
            exame.RegistrarAnaliseIa(
                AdicionarMedicoGerador(analiseJson, _usuarioContexto.UsuarioNome)); 
            await _exameRepository.Update(exame);

            await _auditoriaService.Registrar(
                AcaoAuditoria.AnaliseIaExame,
                "Exame",
                exame.Id,
                $"Prontuário {exame.ProntuarioId} ({documentos.Count} documento(s))");

            return RegistrarExameUseCase.MapToResponse(exame);
        }

        private static string AdicionarMedicoGerador(string analiseJson, string? nomeMedico)
        {
            if (string.IsNullOrWhiteSpace(nomeMedico))
                return analiseJson;

            try
            {
                if (JsonNode.Parse(analiseJson) is JsonObject objeto)
                {
                    objeto["geradoPorMedico"] = nomeMedico;
                    return objeto.ToJsonString();
                }
            }
            catch (JsonException)
            {
                // Resposta fora do formato esperado: mantém o JSON original
            }

            return analiseJson;
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

        private static string MontarContextoAnonimo(
            Exame exame, Paciente paciente, IdentificadoresPaciente identificadores, int arquivosIgnorados)
        {
            var sb = new StringBuilder();
            sb.AppendLine($"Exame: {AnonimizadorDeTexto.Anonimizar(exame.Nome, identificadores)} (Categoria: {exame.Categoria})");

            if (!string.IsNullOrWhiteSpace(exame.Descricao))
                sb.AppendLine($"Descrição clínica: {AnonimizadorDeTexto.Anonimizar(exame.Descricao, identificadores)}");

            if (!string.IsNullOrWhiteSpace(exame.Observacoes))
                sb.AppendLine($"Observações informadas: {AnonimizadorDeTexto.Anonimizar(exame.Observacoes, identificadores)}");

            if (paciente.DataNascimento.HasValue)
                sb.AppendLine($"Idade do paciente: {CalcularIdade(paciente.DataNascimento.Value)} anos");

            if (!string.IsNullOrWhiteSpace(paciente.Sexo))
                sb.AppendLine($"Sexo biológico: {paciente.Sexo}");

            if (!string.IsNullOrWhiteSpace(paciente.InformacoesAdicionais))
                sb.AppendLine($"Comorbidades / Alergias / Histórico relevante: {AnonimizadorDeTexto.Anonimizar(paciente.InformacoesAdicionais, identificadores)}");

            if (arquivosIgnorados > 0)
                sb.AppendLine(
                    $"Observação: {arquivosIgnorados} arquivo(s) anexado(s) não foram incluídos na análise " +
                    "por serem imagens ou documentos escaneados. Informe nos pontos de atenção que a análise está incompleta.");

            return sb.ToString();
        }

        private static int CalcularIdade(DateOnly nascimento)
        {
            var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
            var idade = hoje.Year - nascimento.Year;
            if (hoje < nascimento.AddYears(idade)) idade--;
            return Math.Max(0, idade);
        }
    }
}