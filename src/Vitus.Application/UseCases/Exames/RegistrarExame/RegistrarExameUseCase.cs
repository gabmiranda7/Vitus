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

        public RegistrarExameUseCase(
            IExameRepository exameRepository,
            IProntuarioRepository prontuarioRepository)
        {
            _exameRepository = exameRepository;
            _prontuarioRepository = prontuarioRepository;
        }

        public async Task<ExameResponseJson> Execute(CreateExameRequestJson request)
        {
            var prontuario = await _prontuarioRepository.GetById(request.ProntuarioId);

            if (prontuario == null)
                throw new DomainException("Prontuário não encontrado");

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

            return MapToResponse(exame);
        }

        public static ExameResponseJson MapToResponse(Exame e) => new()
        {
            Id = e.Id,
            ProntuarioId = e.ProntuarioId,
            ConsultaId = e.ConsultaId,
            Categoria = e.Categoria.ToString(),
            Nome = e.Nome,
            Descricao = e.Descricao,
            MedicoSolicitante = e.MedicoSolicitante,
            DataExame = e.DataExame,
            Observacoes = e.Observacoes,
            NomeArquivoOriginal = e.NomeArquivoOriginal,
            TemArquivo = e.CaminhoArquivo != null
        };
    }
}