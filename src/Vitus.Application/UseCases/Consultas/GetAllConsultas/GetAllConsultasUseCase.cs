using Vitus.Communication.Consulta.Responses;
using Vitus.Domain.Enums;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Consultas.GetAllConsultas
{
    public class GetAllConsultasUseCase
    {
        private readonly IConsultaRepository _consultaRepository;
        private readonly IPacienteRepository _pacienteRepository;
        private readonly IMedicoRepository _medicoRepository;
        private readonly IUsuarioContexto _usuarioContexto;

        public GetAllConsultasUseCase(
            IConsultaRepository consultaRepository,
            IPacienteRepository pacienteRepository,
            IMedicoRepository medicoRepository,
            IUsuarioContexto usuarioContexto)
        {
            _consultaRepository = consultaRepository;
            _pacienteRepository = pacienteRepository;
            _medicoRepository = medicoRepository;
            _usuarioContexto = usuarioContexto;
        }

        public async Task<List<ConsultaResponseJson>> Execute()
        {
            var consultas = await _consultaRepository.GetAll();

            if (_usuarioContexto.Perfil == nameof(PerfilUsuario.Medico))
            {
                var medicoLogado = await _medicoRepository.GetByUsuarioId(_usuarioContexto.UsuarioId);
                if (medicoLogado == null)
                    return [];

                consultas = consultas
                    .Where(c => c.MedicoId == medicoLogado.Id)
                    .ToList();
            }

            if (consultas.Count == 0)
                return [];

            var pacientes = await _pacienteRepository.GetAll();
            var medicos = await _medicoRepository.GetAll();

            return consultas.Select(c =>
            {
                var paciente = pacientes.First(p => p.Id == c.PacienteId);
                var medico = medicos.First(m => m.Id == c.MedicoId);

                return ConsultaMapper.ToResponse(c, paciente, medico);
            }).ToList();
        }
    }
}