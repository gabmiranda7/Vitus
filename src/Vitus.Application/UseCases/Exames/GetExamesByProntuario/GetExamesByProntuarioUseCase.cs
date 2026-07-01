using Vitus.Application.UseCases.Exames.RegistrarExame;
using Vitus.Communication.Exame.Responses;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Exames.GetExamesByProntuario
{
    public class GetExamesByProntuarioUseCase
    {
        private readonly IExameRepository _exameRepository;
        private readonly IProntuarioRepository _prontuarioRepository;

        public GetExamesByProntuarioUseCase(
            IExameRepository exameRepository,
            IProntuarioRepository prontuarioRepository)
        {
            _exameRepository = exameRepository;
            _prontuarioRepository = prontuarioRepository;
        }

        public async Task<IList<ExameResponseJson>> Execute(Guid prontuarioId)
        {
            var prontuario = await _prontuarioRepository.GetById(prontuarioId);

            if (prontuario == null)
                throw new DomainException("Prontuário não encontrado");

            var exames = await _exameRepository.GetByProntuarioId(prontuarioId);

            return exames.Select(RegistrarExameUseCase.MapToResponse).ToList();
        }
    }
}