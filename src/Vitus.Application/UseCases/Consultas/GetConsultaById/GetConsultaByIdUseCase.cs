using Vitus.Communication.Consulta.Responses;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Consultas.GetConsultaById
{
    public class GetConsultaByIdUseCase
    {
        private readonly IConsultaRepository _consultaRepository;
        private readonly IPacienteRepository _pacienteRepository;
        private readonly IMedicoRepository _medicoRepository;
        private readonly IConsultaAcessoService _acessoService;

        public GetConsultaByIdUseCase(
            IConsultaRepository consultaRepository,
            IPacienteRepository pacienteRepository,
            IMedicoRepository medicoRepository,
            IConsultaAcessoService acessoService)
        {
            _consultaRepository = consultaRepository;
            _pacienteRepository = pacienteRepository;
            _medicoRepository = medicoRepository;
            _acessoService = acessoService;
        }

        public async Task<ConsultaResponseJson?> Execute(Guid id)
        {
            var consulta = await _consultaRepository.GetById(id);

            if (consulta == null)
                return null;

            await _acessoService.GarantirResponsavelSeMedico(consulta);

            var paciente = await _pacienteRepository.GetById(consulta.PacienteId);
            var medico = await _medicoRepository.GetById(consulta.MedicoId);

            return ConsultaMapper.ToResponse(consulta, paciente!, medico!);
        }
    }
}