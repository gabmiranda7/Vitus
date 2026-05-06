using Vitus.Communication.Consulta.Responses;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Consultas.AguardarAtendimento
{
    public class AguardarAtendimentoUseCase
    {
        private readonly IConsultaRepository _consultaRepository;
        private readonly IPacienteRepository _pacienteRepository;
        private readonly IMedicoRepository _medicoRepository;

        public AguardarAtendimentoUseCase(
            IConsultaRepository consultaRepository,
            IPacienteRepository pacienteRepository,
            IMedicoRepository medicoRepository)
        {
            _consultaRepository = consultaRepository;
            _pacienteRepository = pacienteRepository;
            _medicoRepository = medicoRepository;
        }

        public async Task<ConsultaResponseJson> Execute(Guid id)
        {
            var consulta = await _consultaRepository.GetById(id);

            if (consulta == null)
                throw new Exception("Consulta não encontrada");

            consulta.AguardarAtendimento();

            await _consultaRepository.Update(consulta);

            var paciente = await _pacienteRepository.GetById(consulta.PacienteId);
            var medico = await _medicoRepository.GetById(consulta.MedicoId);

            return new ConsultaResponseJson
            {
                Id = consulta.Id,
                PacienteId = consulta.PacienteId,
                DataConsulta = consulta.DataConsulta,
                Status = consulta.Status.ToString(),
                NomePaciente = paciente!.Nome,
                NomeMedico = medico!.Nome,
                Anotacoes = consulta.Anotacoes
            };
        }
    }
}