using Vitus.Communication.Exame.Requests;
using Vitus.Communication.Exame.Responses;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Exames.RegistrarExame
{
    public class RegistrarExameUseCase
    {
        private readonly IExameRepository _exameRepository;
        private readonly IProntuarioRepository _prontuarioRepository;
        private readonly IAuditoriaService _auditoriaService;
        private readonly IConsultaRepository _consultaRepository;
        private readonly IConsultaAcessoService _acessoService;

        public RegistrarExameUseCase(
            IExameRepository exameRepository,
            IProntuarioRepository prontuarioRepository,
            IAuditoriaService auditoriaService,
            IConsultaRepository consultaRepository,
            IConsultaAcessoService acessoService)
        {
            _exameRepository = exameRepository;
            _prontuarioRepository = prontuarioRepository;
            _auditoriaService = auditoriaService;
            _consultaRepository = consultaRepository;
            _acessoService = acessoService;
        }

        public async Task<ExameResponseJson> Execute(CreateExameRequestJson request)
        {
            var prontuario = await _prontuarioRepository.GetById(request.ProntuarioId);

            if (prontuario == null)
                throw new DomainException("Prontuário não encontrado");

            if (request.ConsultaId.HasValue)
            {
                var consulta = await _consultaRepository.GetById(request.ConsultaId.Value);

                if (consulta == null || consulta.ProntuarioId != request.ProntuarioId)
                    throw new DomainException("Consulta não encontrada para este prontuário");

                await _acessoService.GarantirMedicoResponsavel(consulta);
            }

            if (!Enum.TryParse<CategoriaExame>(request.Categoria, ignoreCase: true, out var categoria))
                throw new DomainException("Categoria inválida");

            var exame = new Exame(
                request.ProntuarioId,
                request.ConsultaId,
                categoria,
                request.Nome,
                request.Descricao,
                request.MedicoSolicitante,
                request.DataExame,
                request.Observacoes
            );

            await _exameRepository.Add(exame);

            await _auditoriaService.Registrar(AcaoAuditoria.RegistroExame, "Exame", exame.Id, $"Prontuário {exame.ProntuarioId}");

            return MapToResponse(exame);
        }

        public static ExameResponseJson MapToResponse(Exame exame)
        {
            var arquivos = exame.Arquivos
                .OrderBy(a => a.DataUpload)
                .Select(a => new ExameArquivoResponseJson
                {
                    Id = a.Id,
                    NomeArquivoOriginal = a.NomeArquivoOriginal,
                    DataUpload = a.DataUpload
                })
                .ToList();

            // Retrocompatibilidade para exames antigos que tinham apenas CaminhoArquivo
            if (arquivos.Count == 0 && !string.IsNullOrEmpty(exame.CaminhoArquivo))
            {
                arquivos.Add(new ExameArquivoResponseJson
                {
                    Id = exame.Id,
                    NomeArquivoOriginal = exame.NomeArquivoOriginal ?? "exame",
                    DataUpload = exame.DataExame.ToDateTime(TimeOnly.MinValue)
                });
            }

            return new ExameResponseJson
            {
                Id = exame.Id,
                ProntuarioId = exame.ProntuarioId,
                ConsultaId = exame.ConsultaId,
                Categoria = exame.Categoria.ToString(),
                Nome = exame.Nome,
                Descricao = exame.Descricao,
                MedicoSolicitante = exame.MedicoSolicitante,
                DataExame = exame.DataExame,
                Observacoes = exame.Observacoes,
                NomeArquivoOriginal = exame.NomeArquivoOriginal,
                TemArquivo = arquivos.Count > 0,
                Arquivos = arquivos,
                AnaliseIaJson = exame.AnaliseIaJson,
                DataAnaliseIa = exame.DataAnaliseIa
            };
        }
    }
}