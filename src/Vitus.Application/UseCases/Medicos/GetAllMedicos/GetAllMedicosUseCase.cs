using Vitus.Communication.Medico.Responses;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Medicos.GetAllMedicos
{
    public class GetAllMedicosUseCase
    {
        private readonly IMedicoRepository _repository;

        public GetAllMedicosUseCase(IMedicoRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<MedicoResponseJson>> Execute()
        {
            var medicos = await _repository.GetAll();

            return medicos.Select(m => new MedicoResponseJson
            {
                Id = m.Id,
                Nome = m.Nome,
                Especialidade = m.Especialidade,
                CRM = m.CRM
            }).ToList();
        }
    }
}