using Vitus.Communication.Consulta.Requests;
using Vitus.Communication.Consulta.Responses;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Consultas.AnotarConsulta
{
    public class AnotarConsultaUseCase
    {
        private readonly IConsultaRepository _consultaRepository;
        private readonly IPacienteRepository _pacienteRepository;
        private readonly IMedicoRepository _medicoRepository;
        private readonly IConsultaAcessoService _acessoService;
        private readonly IAuditoriaService _auditoriaService;

        public AnotarConsultaUseCase(
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

        public async Task<ConsultaResponseJson> Execute(Guid id, AnotarConsultaRequestJson request)
        {
            var consulta = await _consultaRepository.GetById(id);

            if (consulta == null)
                throw new DomainException("Consulta não encontrada");

            await _acessoService.GarantirMedicoResponsavel(consulta);

            consulta.Anotar(request.Anotacoes);
            await _consultaRepository.Update(consulta);
            await _auditoriaService.Registrar(AcaoAuditoria.AnotacaoClinica, "Consulta", consulta.Id);

            var paciente = await _pacienteRepository.GetById(consulta.PacienteId);
            var medico = await _medicoRepository.GetById(consulta.MedicoId);

            return new ConsultaResponseJson
            {
                Id = consulta.Id,
                PacienteId = consulta.PacienteId,
                MedicoId = consulta.MedicoId,
                DataConsulta = consulta.DataConsulta,
                Status = consulta.Status.ToString(),
                NomePaciente = paciente!.Nome,
                NomeMedico = medico!.Nome,
                Anotacoes = consulta.Anotacoes
            };
        }
    }
}