using Vitus.Communication.Exame.Responses;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Exames.DownloadArquivo
{
    public class DownloadArquivoExameUseCase
    {
        private readonly IExameRepository _exameRepository;
        private readonly IArquivoService _arquivoService;

        public DownloadArquivoExameUseCase(
            IExameRepository exameRepository,
            IArquivoService arquivoService)
        {
            _exameRepository = exameRepository;
            _arquivoService = arquivoService;
        }

        public async Task<ArquivoDownloadResult> Execute(Guid exameId)
        {
            var exame = await _exameRepository.GetById(exameId);

            if (exame == null)
                throw new DomainException("Exame não encontrado");

            if (exame.CaminhoArquivo == null)
                throw new DomainException("Exame não possui arquivo anexado");

            var conteudo = await _arquivoService.Ler(exame.CaminhoArquivo);
            var extensao = Path.GetExtension(exame.NomeArquivoOriginal ?? "").ToLowerInvariant();

            var contentType = extensao switch
            {
                ".pdf" => "application/pdf",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                _ => "application/octet-stream"
            };

            return new ArquivoDownloadResult(conteudo, contentType, exame.NomeArquivoOriginal ?? "arquivo");
        }
    }
}