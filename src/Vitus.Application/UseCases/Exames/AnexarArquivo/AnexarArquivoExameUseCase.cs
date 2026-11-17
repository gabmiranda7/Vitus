using Microsoft.AspNetCore.Http;
using Vitus.Communication.Exame.Responses;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;
using Vitus.Application.UseCases.Exames.RegistrarExame;

namespace Vitus.Application.UseCases.Exames.AnexarArquivo
{
    public class AnexarArquivoExameUseCase
    {
        private readonly IExameRepository _exameRepository;
        private readonly IArquivoService _arquivoService;
        private readonly IAuditoriaService _auditoriaService;

        private static readonly Dictionary<string, byte[][]> AssinaturasValidas = new()
        {
            [".pdf"] = new[] { new byte[] { 0x25, 0x50, 0x44, 0x46 } },
            [".png"] = new[] { new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A } },
            [".jpg"] = new[] { new byte[] { 0xFF, 0xD8, 0xFF } },
            [".jpeg"] = new[] { new byte[] { 0xFF, 0xD8, 0xFF } },
        };

        public AnexarArquivoExameUseCase(
            IExameRepository exameRepository,
            IArquivoService arquivoService,
            IAuditoriaService auditoriaService)
        {
            _exameRepository = exameRepository;
            _arquivoService = arquivoService;
            _auditoriaService = auditoriaService;
        }

        // Mantém compatibilidade com o endpoint atual POST /api/exames/{id}/arquivo
        public Task<ExameResponseJson> Execute(Guid exameId, IFormFile arquivo)
            => Execute(exameId, new List<IFormFile> { arquivo });

        // Novo suporte para múltiplos arquivos (até 15)
        public async Task<ExameResponseJson> Execute(Guid exameId, IList<IFormFile> arquivos)
        {
            if (arquivos == null || arquivos.Count == 0)
                throw new DomainException("Selecione ao menos um arquivo.");

            var exame = await _exameRepository.GetById(exameId);

            if (exame == null)
                throw new DomainException("Exame não encontrado");

            if (exame.TotalArquivos() + arquivos.Count > Exame.MaximoArquivos)
                throw new DomainException($"Limite máximo de {Exame.MaximoArquivos} arquivos por exame.");

            foreach (var arquivo in arquivos)
            {
                var extensao = Path.GetExtension(arquivo.FileName).ToLowerInvariant();

                if (!AssinaturasValidas.ContainsKey(extensao))
                    throw new DomainException($"Formato inválido ({arquivo.FileName}). Use PDF, JPG ou PNG");

                if (arquivo.Length > 10 * 1024 * 1024)
                    throw new DomainException($"Arquivo {arquivo.FileName} muito grande. Tamanho máximo: 10MB");

                await ValidarConteudoReal(arquivo, extensao);

                using var stream = arquivo.OpenReadStream();
                var caminho = await _arquivoService.Salvar(stream, arquivo.FileName, "exames");

                exame.AnexarArquivo(caminho, arquivo.FileName);
            }

            await _exameRepository.Update(exame);

            await _auditoriaService.Registrar(
                AcaoAuditoria.AnexoExame,
                "Exame",
                exame.Id,
                $"Prontuário {exame.ProntuarioId} (+{arquivos.Count} arquivo(s))");

            return RegistrarExameUseCase.MapToResponse(exame);
        }

        private static async Task ValidarConteudoReal(IFormFile arquivo, string extensao)
        {
            var assinaturas = AssinaturasValidas[extensao];
            var tamanhoMaximoAssinatura = assinaturas.Max(a => a.Length);

            var buffer = new byte[tamanhoMaximoAssinatura];
            using (var stream = arquivo.OpenReadStream())
            {
                var bytesLidos = await stream.ReadAsync(buffer, 0, buffer.Length);
                if (bytesLidos < tamanhoMaximoAssinatura)
                    throw new DomainException($"Arquivo corrompido ou inválido: {arquivo.FileName}");
            }

            var valido = assinaturas.Any(assinatura =>
                buffer.Take(assinatura.Length).SequenceEqual(assinatura));

            if (!valido)
                throw new DomainException($"O conteúdo de {arquivo.FileName} não corresponde ao formato declarado");
        }
    }
}