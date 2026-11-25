using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Pacientes.InativarPaciente
{
    public class InativarPacienteUseCase
    {
        private readonly IPacienteRepository _repository;
        private readonly IConsultaRepository _consultaRepository;
        private readonly IAuditoriaService _auditoriaService;

        public InativarPacienteUseCase(
            IPacienteRepository repository,
            IConsultaRepository consultaRepository,
            IAuditoriaService auditoriaService)
        {
            _repository = repository;
            _consultaRepository = consultaRepository;
            _auditoriaService = auditoriaService;
        }

        public async Task Execute(Guid id)
        {
            var paciente = await _repository.GetById(id);

            if (paciente == null)
                throw new DomainException("Paciente não encontrado.");

            if (await _consultaRepository.ExisteEmAndamentoDoPaciente(paciente.Id))
                throw new DomainException(
                    "Este paciente tem consultas em andamento. Finalize ou cancele antes de inativar");

            paciente.Inativar();
            await _repository.Update(paciente);

            await _auditoriaService.Registrar(
                AcaoAuditoria.InativacaoPaciente,
                "Paciente",
                paciente.Id,
                $"Paciente '{paciente.Nome}' inativado");
        }
    }
}