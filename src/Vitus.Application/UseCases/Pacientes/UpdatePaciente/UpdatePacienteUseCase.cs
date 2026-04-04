using Vitus.Communication.Paciente.Requests;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Pacientes.UpdatePaciente
{
    public class UpdatePacienteUseCase
    {
        private readonly IPacienteRepository _repository;

        public UpdatePacienteUseCase(IPacienteRepository repository)
        {
            _repository = repository;
        }

        public async Task Execute(Guid id, UpdatePacienteRequestJson request)
        {
            var paciente = await _repository.GetById(id);

            if (paciente == null)
                throw new DomainException("Paciente não encontrado.");

            paciente.DefinirNome(request.Nome);

            await _repository.Update(paciente);
        }
    }
}
