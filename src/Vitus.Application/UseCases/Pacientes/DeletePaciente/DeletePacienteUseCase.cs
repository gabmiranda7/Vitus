using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;
using Vitus.Domain.Services;

namespace Vitus.Application.UseCases.Pacientes.DeletePaciente
{
    public class DeletePacienteUseCase
    {
        private readonly IPacienteRepository _repository;
        private readonly IAuditoriaService _auditoriaService;

        public DeletePacienteUseCase(IPacienteRepository repository, IAuditoriaService auditoriaService)
        {
            _repository = repository;
            _auditoriaService = auditoriaService;
        }

        public async Task Execute(Guid id)
        {
            var paciente = await _repository.GetById(id);

            if (paciente == null)
                throw new DomainException("Paciente não encontrado.");

            await _auditoriaService.Registrar(AcaoAuditoria.ExclusaoPaciente, "Paciente", paciente.Id, paciente.Nome);
            await _repository.Delete(paciente);
        }
    }
}