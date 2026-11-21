using Vitus.Communication.Consulta.Requests;
using Vitus.Communication.Consulta.Responses;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Consultas.CreateConsulta
{
    public class CreateConsultaUseCase
    {
        private readonly IConsultaRepository _consultaRepository;
        private readonly IMedicoRepository _medicoRepository;
        private readonly IPacienteRepository _pacienteRepository;
        private readonly IAuditoriaService _auditoriaService;
        private readonly IUsuarioRepository _usuarioRepository;

        public CreateConsultaUseCase(
            IConsultaRepository consultaRepository,
            IMedicoRepository medicoRepository,
            IPacienteRepository pacienteRepository,
            IAuditoriaService auditoriaService,
            IUsuarioRepository usuarioRepository)
        {
            _consultaRepository = consultaRepository;
            _medicoRepository = medicoRepository;
            _pacienteRepository = pacienteRepository;
            _auditoriaService = auditoriaService;
            _usuarioRepository = usuarioRepository;
        }

        public async Task<ConsultaResponseJson> Execute(CreateConsultaRequestJson request)
        {
            var paciente = await _pacienteRepository.GetById(request.PacienteId);

            if (paciente == null)
                throw new DomainException("Paciente não encontrado");

            var medico = await _medicoRepository.GetById(request.MedicoId);

            if (medico == null)
                throw new DomainException("Médico não encontrado");

            var usuarioMedico = await _usuarioRepository.GetById(medico.UsuarioId);

            if (usuarioMedico == null || usuarioMedico.Status != StatusUsuario.Aprovado)
                throw new DomainException("Médico indisponível para atendimentos");

            var consulta = new Consulta(
                request.PacienteId,
                request.MedicoId,
                paciente.Prontuario.Id,
                request.DataConsulta
            );

            await _consultaRepository.Add(consulta);
            await _auditoriaService.Registrar(AcaoAuditoria.CriacaoConsulta, "Consulta", consulta.Id);

            return ConsultaMapper.ToResponse(consulta, paciente, medico);
        }
    }
}