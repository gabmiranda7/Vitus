using Vitus.Communication.Consulta.Responses;
using Vitus.Communication.Prontuario.Responses;
using Vitus.Communication.Receita.Responses;
using Vitus.Communication.Triagem.Responses;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Prontuarios.GetProntuarioByConsultaId
{
    public class GetProntuarioByConsultaIdUseCase
    {
        private readonly IConsultaRepository _consultaRepository;
        private readonly IProntuarioRepository _prontuarioRepository;
        private readonly IPacienteRepository _pacienteRepository;
        private readonly IMedicoRepository _medicoRepository;
        private readonly IAuditoriaService _auditoriaService;

        public GetProntuarioByConsultaIdUseCase(
            IConsultaRepository consultaRepository,
            IProntuarioRepository prontuarioRepository,
            IPacienteRepository pacienteRepository,
            IMedicoRepository medicoRepository,
            IAuditoriaService auditoriaService)
        {
            _consultaRepository = consultaRepository;
            _prontuarioRepository = prontuarioRepository;
            _pacienteRepository = pacienteRepository;
            _medicoRepository = medicoRepository;
            _auditoriaService = auditoriaService;
        }

        public async Task<ProntuarioResponseJson> Execute(Guid consultaId)
        {
            var consulta = await _consultaRepository.GetById(consultaId);

            if (consulta == null)
                throw new DomainException("Consulta não encontrada");

            var prontuario = await _prontuarioRepository.GetByPacienteId(consulta.PacienteId);

            if (prontuario == null)
                throw new DomainException("Prontuário não encontrado");

            await _auditoriaService.Registrar(AcaoAuditoria.AcessoProntuario, "Prontuario", prontuario.Id);

            var pacientes = await _pacienteRepository.GetAll();
            var medicos = await _medicoRepository.GetAll();

            return new ProntuarioResponseJson
            {
                Id = prontuario.Id,
                PacienteId = prontuario.PacienteId,
                Triagens = prontuario.Triagens.Select(t => new TriagemResponseJson
                {
                    Id = t.Id,
                    ProntuarioId = t.ProntuarioId,
                    Observacoes = t.Observacoes,
                    PressaoArterial = t.PressaoArterial,
                    Temperatura = t.Temperatura,
                    NomeEnfermeiro = t.NomeEnfermeiro
                }).ToList(),
                Consultas = prontuario.Consultas.Select(c =>
                {
                    var paciente = pacientes.FirstOrDefault(p => p.Id == c.PacienteId);
                    var medico = medicos.FirstOrDefault(m => m.Id == c.MedicoId);
                    return new ConsultaResponseJson
                    {
                        Id = c.Id,
                        PacienteId = c.PacienteId,
                        MedicoId = c.MedicoId,
                        DataConsulta = c.DataConsulta,
                        Status = c.Status.ToString(),
                        NomePaciente = paciente?.Nome ?? "",
                        NomeMedico = medico?.Nome ?? "",
                        Anotacoes = c.Anotacoes
                    };
                }).ToList(),
                Receitas = prontuario.Receitas.Select(r => new ReceitaResponseJson
                {
                    Id = r.Id,
                    ConsultaId = r.ConsultaId,
                    Medicamentos = r.Medicamentos.Select(m => new MedicamentoResponseJson
                    {
                        Nome = m.Nome,
                        Dosagem = m.Dosagem,
                        Posologia = m.Posologia
                    }).ToList()
                }).ToList()
            };
        }
    }
}