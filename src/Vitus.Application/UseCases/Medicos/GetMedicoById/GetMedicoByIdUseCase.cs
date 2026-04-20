using Vitus.Communication.Medico.Responses;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Medicos.GetMedicoById
{
    public class GetMedicoByIdUseCase
    {
        private readonly IMedicoRepository _repository;

        public GetMedicoByIdUseCase(IMedicoRepository repository)
        {
            _repository = repository;
        }

        public async Task<MedicoResponseJson?> Execute(Guid id)
        {
            var medico = await _repository.GetById(id);

            if (medico == null)
                return null;

            return new MedicoResponseJson
            {
                Id = medico.Id,
                Nome = medico.Nome,
                Especialidade = medico.Especialidade
            };
        }
    }
}