using Vitus.Communication.Paciente.Responses;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Pacientes.GetPacienteById
{
    public class GetPacienteByIdUseCase
    {
        private readonly IPacienteRepository _repository;

        public GetPacienteByIdUseCase(IPacienteRepository repository)
        {
            _repository = repository;
        }

        public async Task<PacienteResponseJson?> Execute(Guid id)
        {
            var paciente = await _repository.GetById(id);

            if (paciente == null)
                return null;

            return new PacienteResponseJson
            {
                Id = paciente.Id,
                Nome = paciente.Nome
            };
        }
    }
}