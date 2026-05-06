using Vitus.Communication.Consulta.Responses;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Consultas.GetAllConsultas
{
    public class GetAllConsultasUseCase
    {
        private readonly IConsultaRepository _consultaRepository;
        private readonly IPacienteRepository _pacienteRepository;
        private readonly IMedicoRepository _medicoRepository;

        public GetAllConsultasUseCase(
            IConsultaRepository consultaRepository,
            IPacienteRepository pacienteRepository,
            IMedicoRepository medicoRepository)
        {
            _consultaRepository = consultaRepository;
            _pacienteRepository = pacienteRepository;
            _medicoRepository = medicoRepository;
        }

        public async Task<List<ConsultaResponseJson>> Execute()
        {
            var consultas = await _consultaRepository.GetAll();
            var pacientes = await _pacienteRepository.GetAll();
            var medicos = await _medicoRepository.GetAll();

            return consultas.Select(c =>
            {
                var paciente = pacientes.First(p => p.Id == c.PacienteId);
                var medico = medicos.First(m => m.Id == c.MedicoId);

                return new ConsultaResponseJson
                {
                    Id = c.Id,
                    PacienteId = c.PacienteId,
                    DataConsulta = c.DataConsulta,
                    Status = c.Status.ToString(),
                    NomePaciente = paciente.Nome,
                    NomeMedico = medico.Nome,
                    Anotacoes = c.Anotacoes
                };
            }).ToList();
        }
    }
}