using Vitus.Communication.Exame.Responses;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Exames.DownloadArquivo
{
    public class DownloadArquivoExameUseCase
    {
        private readonly IExameRepository _exameRepository;
        private readonly IArquivoService _arquivoService;
        private readonly IAuditoriaService _auditoriaService;

        public DownloadArquivoExameUseCase(
            IExameRepository exameRepository,
            IArquivoService arquivoService,
            IAuditoriaService auditoriaService)
        {
            _exameRepository = exameRepository;
            _arquivoService = arquivoService;
            _auditoriaService = auditoriaService;
        }

        public async Task<ArquivoDownloadResult> Execute(Guid exameId, Guid? arquivoId = null)
        {
            var exame = await _exameRepository.GetById(exameId);

            if (exame == null)
                throw new DomainException("Exame não encontrado");

            string? caminho;
            string? nomeOriginal;

            if (arquivoId.HasValue && exame.Arquivos.Count > 0)
            {
                var item = exame.Arquivos.FirstOrDefault(a => a.Id == arquivoId.Value);
                if (item == null)
                    throw new DomainException("Arquivo não encontrado neste exame");

                caminho = item.CaminhoArquivo;
                nomeOriginal = item.NomeArquivoOriginal;
            }
            else if (exame.Arquivos.Count > 0)
            {
                var primeiro = exame.Arquivos.OrderBy(a => a.DataUpload).First();
                caminho = primeiro.CaminhoArquivo;
                nomeOriginal = primeiro.NomeArquivoOriginal;
            }
            else
            {
                caminho = exame.CaminhoArquivo;
                nomeOriginal = exame.NomeArquivoOriginal;
            }

            if (string.IsNullOrEmpty(caminho))
                throw new DomainException("Exame não possui arquivo anexado");

            var conteudo = await _arquivoService.Ler(caminho);

            await _auditoriaService.Registrar(
                AcaoAuditoria.DownloadExame,
                "Exame",
                exame.Id,
                $"Prontuário {exame.ProntuarioId}");

            var extensao = Path.GetExtension(nomeOriginal ?? "").ToLowerInvariant();

            var contentType = extensao switch
            {
                ".pdf" => "application/pdf",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                _ => "application/octet-stream"
            };

            return new ArquivoDownloadResult(conteudo, contentType, nomeOriginal ?? "arquivo");
        }
    }
}