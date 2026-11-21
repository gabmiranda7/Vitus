using Vitus.Application.UseCases.Prontuarios.GetProntuarioByPacienteId;
using Vitus.Communication.Consulta.Responses;
using Vitus.Communication.Prontuario.Responses;
using Vitus.Communication.Receita.Responses;
using Vitus.Communication.Triagem.Responses;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Prontuarios.GetProntuarioByConsultaId
{
    public class GetProntuarioByConsultaIdUseCase
    {
        private readonly IConsultaRepository _consultaRepository;
        private readonly IProntuarioRepository _prontuarioRepository;
        private readonly IPacienteRepository _pacienteRepository;
        private readonly IMedicoRepository _medicoRepository;
        private readonly IAuditoriaService _auditoriaService;

        public GetProntuarioByConsultaIdUseCase(
            IConsultaRepository consultaRepository,
            IProntuarioRepository prontuarioRepository,
            IPacienteRepository pacienteRepository,
            IMedicoRepository medicoRepository,
            IAuditoriaService auditoriaService)
        {
            _consultaRepository = consultaRepository;
            _prontuarioRepository = prontuarioRepository;
            _pacienteRepository = pacienteRepository;
            _medicoRepository = medicoRepository;
            _auditoriaService = auditoriaService;
        }

        public async Task<ProntuarioResponseJson> Execute(Guid consultaId)
        {
            var consulta = await _consultaRepository.GetById(consultaId);

            if (consulta == null)
                throw new DomainException("Consulta não encontrada");

            var prontuario = await _prontuarioRepository.GetByPacienteId(consulta.PacienteId);

            if (prontuario == null)
                throw new DomainException("Prontuário não encontrado");

            await _auditoriaService.Registrar(AcaoAuditoria.AcessoProntuario, "Prontuario", prontuario.Id);

            var pacientes = new List<Paciente>();
            var paciente = await _pacienteRepository.GetById(prontuario.PacienteId);
            if (paciente != null)
                pacientes.Add(paciente);

            var medicos = await _medicoRepository.GetByIds(
                prontuario.Consultas.Select(c => c.MedicoId).Distinct().ToList());

            return GetProntuarioByPacienteIdUseCase.MapToResponse(prontuario, pacientes, medicos);
        }
    }
}