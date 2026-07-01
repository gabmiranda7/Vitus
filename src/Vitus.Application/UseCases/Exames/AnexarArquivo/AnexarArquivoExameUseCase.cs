using Microsoft.AspNetCore.Http;
using Vitus.Communication.Exame.Responses;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;
using Vitus.Application.UseCases.Exames.RegistrarExame;

namespace Vitus.Application.UseCases.Exames.AnexarArquivo
{
    public class AnexarArquivoExameUseCase
    {
        private readonly IExameRepository _exameRepository;
        private readonly IArquivoService _arquivoService;

        public AnexarArquivoExameUseCase(
            IExameRepository exameRepository,
            IArquivoService arquivoService)
        {
            _exameRepository = exameRepository;
            _arquivoService = arquivoService;
        }

        public async Task<ExameResponseJson> Execute(Guid exameId, IFormFile arquivo)
        {
            var exame = await _exameRepository.GetById(exameId);

            if (exame == null)
                throw new DomainException("Exame não encontrado");

            var extensoesPermitidas = new[] { ".pdf", ".jpg", ".jpeg", ".png" };
            var extensao = Path.GetExtension(arquivo.FileName).ToLowerInvariant();

            if (!extensoesPermitidas.Contains(extensao))
                throw new DomainException("Formato inválido. Use PDF, JPG ou PNG");

            if (arquivo.Length > 10 * 1024 * 1024)
                throw new DomainException("Arquivo muito grande. Tamanho máximo: 10MB");

            using var stream = arquivo.OpenReadStream();
            var caminho = await _arquivoService.Salvar(stream, arquivo.FileName, "exames");

            exame.AnexarArquivo(caminho, arquivo.FileName);
            await _exameRepository.Update(exame);

            return RegistrarExameUseCase.MapToResponse(exame);
        }
    }
}