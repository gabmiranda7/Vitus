using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Pacientes.DeletePaciente
{
    public class DeletePacienteUseCase
    {
        private readonly IPacienteRepository _repository;

        public DeletePacienteUseCase(IPacienteRepository repository)
        {
            _repository = repository;
        }

        public async Task Execute(Guid id)
        {
            var paciente = await _repository.GetById(id);

            if (paciente == null)
                throw new DomainException("Paciente não encontrado.");

            await _repository.Delete(paciente);
        }
    }
}