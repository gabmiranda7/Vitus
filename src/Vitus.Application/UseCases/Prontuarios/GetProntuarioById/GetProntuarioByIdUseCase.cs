using Vitus.Application.UseCases.Prontuarios.GetProntuarioByPacienteId;
using Vitus.Communication.Consulta.Responses;
using Vitus.Communication.Prontuario.Responses;
using Vitus.Communication.Receita.Responses;
using Vitus.Communication.Triagem.Responses;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Prontuarios.GetProntuarioById
{
    public class GetProntuarioByIdUseCase
    {
        private readonly IProntuarioRepository _prontuarioRepository;
        private readonly IPacienteRepository _pacienteRepository;
        private readonly IMedicoRepository _medicoRepository;
        private readonly IAuditoriaService _auditoriaService;

        public GetProntuarioByIdUseCase(
            IProntuarioRepository prontuarioRepository,
            IPacienteRepository pacienteRepository,
            IMedicoRepository medicoRepository,
            IAuditoriaService auditoriaService)
        {
            _prontuarioRepository = prontuarioRepository;
            _pacienteRepository = pacienteRepository;
            _medicoRepository = medicoRepository;
            _auditoriaService = auditoriaService;
        }

        public async Task<ProntuarioResponseJson> Execute(Guid id)
        {
            var prontuario = await _prontuarioRepository.GetById(id);

            if (prontuario == null)
                throw new DomainException("Prontuário não encontrado");

            await _auditoriaService.Registrar(AcaoAuditoria.AcessoProntuario, "Prontuario", id);

            var pacientes = await _pacienteRepository.GetAll();
            var medicos = await _medicoRepository.GetAll();

            return GetProntuarioByPacienteIdUseCase.MapToResponse(prontuario, pacientes, medicos);
        }
    }
}