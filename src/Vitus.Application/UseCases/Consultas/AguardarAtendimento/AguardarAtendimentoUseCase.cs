using Vitus.Communication.Consulta.Responses;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Consultas.AguardarAtendimento
{
    public class AguardarAtendimentoUseCase
    {
        private readonly IConsultaRepository _consultaRepository;
        private readonly IPacienteRepository _pacienteRepository;
        private readonly IMedicoRepository _medicoRepository;
        private readonly ITriagemRepository _triagemRepository;

        public AguardarAtendimentoUseCase(
            IConsultaRepository consultaRepository,
            IPacienteRepository pacienteRepository,
            IMedicoRepository medicoRepository,
            ITriagemRepository triagemRepository)
        {
            _consultaRepository = consultaRepository;
            _pacienteRepository = pacienteRepository;
            _medicoRepository = medicoRepository;
            _triagemRepository = triagemRepository;
        }

        public async Task<ConsultaResponseJson> Execute(Guid id)
        {
            var consulta = await _consultaRepository.GetById(id);

            if (consulta == null)
                throw new DomainException("Consulta não encontrada");

            if (consulta.Status == StatusConsulta.EmTriagem &&
                !await _triagemRepository.ExistePorConsulta(consulta.Id))
                throw new DomainException("Registre a triagem antes de encaminhar o paciente para atendimento");

            consulta.AguardarAtendimento();

            await _consultaRepository.Update(consulta);

            var paciente = await _pacienteRepository.GetById(consulta.PacienteId);
            var medico = await _medicoRepository.GetById(consulta.MedicoId);

            return ConsultaMapper.ToResponse(consulta, paciente!, medico!);
        }
    }
}