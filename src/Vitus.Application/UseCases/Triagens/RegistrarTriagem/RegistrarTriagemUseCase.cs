using Vitus.Communication.Triagem.Requests;
using Vitus.Communication.Triagem.Responses;
using Vitus.Domain.Entities;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Triagens.RegistrarTriagem
{
    public class RegistrarTriagemUseCase
    {
        private readonly IConsultaRepository _consultaRepository;
        private readonly ITriagemRepository _triagemRepository;
        private readonly IPacienteRepository _pacienteRepository;

        public RegistrarTriagemUseCase(
            IConsultaRepository consultaRepository,
            ITriagemRepository triagemRepository,
            IPacienteRepository pacienteRepository)
        {
            _consultaRepository = consultaRepository;
            _triagemRepository = triagemRepository;
            _pacienteRepository = pacienteRepository;
        }

        public async Task<TriagemResponseJson> Execute(CreateTriagemRequestJson request, string nomeEnfermeiro)
        {
            var consulta = await _consultaRepository.GetById(request.ConsultaId);

            if (consulta == null)
                throw new DomainException("Consulta não encontrada");

            if (consulta.Status != Vitus.Domain.Enums.StatusConsulta.EmTriagem)
                throw new DomainException("Consulta não está em triagem");

            var paciente = await _pacienteRepository.GetById(consulta.PacienteId);

            if (paciente == null)
                throw new DomainException("Paciente não encontrado");

            var triagem = new Triagem(
                paciente.Prontuario.Id,
                request.Observacoes,
                request.PressaoArterial,
                request.Temperatura,
                nomeEnfermeiro
            );

            paciente.Prontuario.AdicionarTriagem(triagem);
            await _triagemRepository.Add(triagem);

            return new TriagemResponseJson
            {
                Id = triagem.Id,
                ProntuarioId = triagem.ProntuarioId,
                Observacoes = triagem.Observacoes,
                PressaoArterial = triagem.PressaoArterial,
                Temperatura = triagem.Temperatura,
                NomeEnfermeiro = triagem.NomeEnfermeiro
            };
        }
    }
}