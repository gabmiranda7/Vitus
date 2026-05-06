using Vitus.Communication.Consulta.Requests;
using Vitus.Communication.Consulta.Responses;
using Vitus.Domain.Entities;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Consultas.CreateConsulta
{
    public class CreateConsultaUseCase
    {
        private readonly IConsultaRepository _consultaRepository;
        private readonly IMedicoRepository _medicoRepository;
        private readonly IPacienteRepository _pacienteRepository;

        public CreateConsultaUseCase(
            IConsultaRepository consultaRepository,
            IMedicoRepository medicoRepository,
            IPacienteRepository pacienteRepository)
        {
            _consultaRepository = consultaRepository;
            _medicoRepository = medicoRepository;
            _pacienteRepository = pacienteRepository;
        }

        public async Task<ConsultaResponseJson> Execute(CreateConsultaRequestJson request)
        {
            var paciente = await _pacienteRepository.GetById(request.PacienteId);

            if (paciente == null)
                throw new Exception("Paciente não encontrado");

            var medico = await _medicoRepository.GetById(request.MedicoId);

            if (medico == null)
                throw new Exception("Médico não encontrado");

            var consulta = new Consulta(
                request.PacienteId,
                request.MedicoId,
                paciente.Prontuario.Id,
                request.DataConsulta
            );

            await _consultaRepository.Add(consulta);

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