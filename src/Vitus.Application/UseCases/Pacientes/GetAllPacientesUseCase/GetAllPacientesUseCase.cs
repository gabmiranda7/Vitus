using Vitus.Communication.Paciente.Responses;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Pacientes.GetAllPacientes
{
    public class GetAllPacientesUseCase
    {
        private readonly IPacienteRepository _repository;

        public GetAllPacientesUseCase(IPacienteRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<PacienteResponseJson>> Execute()
        {
            var pacientes = await _repository.GetAll();

            return pacientes.Select(p => new PacienteResponseJson
            {
                Id = p.Id,
                Nome = p.Nome
            }).ToList();
        }
    }
}