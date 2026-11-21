using Vitus.Communication.Consulta.Responses;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Consultas.IniciarAtendimento
{
    public class IniciarAtendimentoUseCase
    {
        private readonly IConsultaRepository _consultaRepository;
        private readonly IPacienteRepository _pacienteRepository;
        private readonly IMedicoRepository _medicoRepository;
        private readonly IConsultaAcessoService _acessoService;
        private readonly IAuditoriaService _auditoriaService;

        public IniciarAtendimentoUseCase(
            IConsultaRepository consultaRepository,
            IPacienteRepository pacienteRepository,
            IMedicoRepository medicoRepository,
            IConsultaAcessoService acessoService,
            IAuditoriaService auditoriaService)
        {
            _consultaRepository = consultaRepository;
            _pacienteRepository = pacienteRepository;
            _medicoRepository = medicoRepository;
            _acessoService = acessoService;
            _auditoriaService = auditoriaService;
        }

        public async Task<ConsultaResponseJson> Execute(Guid id)
        {
            var consulta = await _consultaRepository.GetById(id);

            if (consulta == null)
                throw new DomainException("Consulta não encontrada");

            await _acessoService.GarantirMedicoResponsavel(consulta);

            consulta.IniciarAtendimento();

            await _consultaRepository.Update(consulta);
            await _auditoriaService.Registrar(AcaoAuditoria.InicioAtendimento, "Consulta", consulta.Id);

            var paciente = await _pacienteRepository.GetById(consulta.PacienteId);
            var medico = await _medicoRepository.GetById(consulta.MedicoId);

            return ConsultaMapper.ToResponse(consulta, paciente!, medico!);
        }
    }
}