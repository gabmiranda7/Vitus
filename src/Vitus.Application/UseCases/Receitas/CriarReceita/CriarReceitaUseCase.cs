using Vitus.Communication.Receita.Requests;
using Vitus.Communication.Receita.Responses;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Receitas.CriarReceita
{
    public class CriarReceitaUseCase
    {
        private readonly IConsultaRepository _consultaRepository;
        private readonly IPacienteRepository _pacienteRepository;
        private readonly IReceitaRepository _receitaRepository;
        private readonly IAuditoriaService _auditoriaService;

        public CriarReceitaUseCase(
            IConsultaRepository consultaRepository,
            IPacienteRepository pacienteRepository,
            IReceitaRepository receitaRepository,
            IAuditoriaService auditoriaService)
        {
            _consultaRepository = consultaRepository;
            _pacienteRepository = pacienteRepository;
            _receitaRepository = receitaRepository;
            _auditoriaService = auditoriaService;
        }

        public async Task<ReceitaResponseJson> Execute(CreateReceitaRequestJson request)
        {
            var consulta = await _consultaRepository.GetById(request.ConsultaId);

            if (consulta == null)
                throw new DomainException("Consulta não encontrada");

            if (consulta.Status != StatusConsulta.EmAtendimento)
                throw new DomainException("Receita só pode ser criada durante o atendimento");

            var paciente = await _pacienteRepository.GetById(consulta.PacienteId);

            if (paciente == null)
                throw new DomainException("Paciente não encontrado");

            var receita = new Receita(consulta.Id);

            foreach (var medicamento in request.Medicamentos)
                receita.AdicionarMedicamento(medicamento.Nome, medicamento.Dosagem, medicamento.Posologia);

            paciente.Prontuario.AdicionarReceita(receita);
            await _receitaRepository.Add(receita);
            await _auditoriaService.Registrar(AcaoAuditoria.EmissaoReceita, "Receita", receita.Id);

            return new ReceitaResponseJson
            {
                Id = receita.Id,
                ConsultaId = receita.ConsultaId,
                Medicamentos = receita.Medicamentos.Select(m => new MedicamentoResponseJson
                {
                    Nome = m.Nome,
                    Dosagem = m.Dosagem,
                    Posologia = m.Posologia
                }).ToList()
            };
        }
    }
}