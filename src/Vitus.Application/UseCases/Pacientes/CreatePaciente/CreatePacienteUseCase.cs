using Vitus.Communication.Paciente.Requests;
using Vitus.Communication.Paciente.Responses;
using Vitus.Domain.Entities;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Pacientes.CreatePaciente
{
    public class CreatePacienteUseCase
    {
        private readonly IPacienteRepository _pacienteRepository;

        public CreatePacienteUseCase(IPacienteRepository pacienteRepository)
        {
            _pacienteRepository = pacienteRepository;
        }

        public async Task<PacienteResponseJson> Execute(CreatePacienteRequestJson request)
        {
            var paciente = new Paciente(request.Nome);

            await _pacienteRepository.Add(paciente);

            return new PacienteResponseJson
            {
                Id = paciente.Id,
                Nome = paciente.Nome
            };
        }
    }
}