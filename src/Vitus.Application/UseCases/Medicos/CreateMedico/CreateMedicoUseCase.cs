using Vitus.Communication.Medico.Requests;
using Vitus.Domain.Entities;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Medicos.CreateMedico
{
    public class CreateMedicoUseCase
    {
        private readonly IMedicoRepository _repository;

        public CreateMedicoUseCase(IMedicoRepository repository)
        {
            _repository = repository;
        }

        public async Task Execute(CreateMedicoRequestJson request)
        {
            var medico = new Medico(request.Nome, request.Especialidade, request.CRM);

            await _repository.Add(medico);
        }
    }
}