using Vitus.Communication.Consulta.Requests;
using Vitus.Communication.Consulta.Responses;
using Vitus.Domain.Entities;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Consultas.CreateConsulta
{
    public class CreateConsultaUseCase
    {
        private readonly IPacienteRepository _pacienteRepository;
        private readonly IConsultaRepository _consultaRepository;

        public CreateConsultaUseCase(
            IPacienteRepository pacienteRepository,
            IConsultaRepository consultaRepository)
        {
            _pacienteRepository = pacienteRepository;
            _consultaRepository = consultaRepository;
        }

        public async Task<ConsultaResponseJson> Execute(CreateConsultaRequestJson request)
        {
            var paciente = await _pacienteRepository.GetById(request.PacienteId);

            if (paciente == null)
                throw new Exception("Paciente não encontrado");

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
                DataConsulta = consulta.DataConsulta,
                Status = consulta.Status.ToString()
            };
        }
    }
}