using Vitus.Communication.Consulta.Responses;
using Vitus.Communication.Prontuario.Responses;
using Vitus.Communication.Receita.Responses;
using Vitus.Communication.Triagem.Responses;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Prontuarios.GetProntuarioByPacienteId
{
    public class GetProntuarioByPacienteIdUseCase
    {
        private readonly IProntuarioRepository _prontuarioRepository;

        public GetProntuarioByPacienteIdUseCase(IProntuarioRepository prontuarioRepository)
        {
            _prontuarioRepository = prontuarioRepository;
        }

        public async Task<ProntuarioResponseJson> Execute(Guid pacienteId)
        {
            var prontuario = await _prontuarioRepository.GetByPacienteId(pacienteId);

            if (prontuario == null)
                throw new DomainException("Prontuário não encontrado");

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
                    Temperatura = t.Temperatura
                }).ToList(),
                Consultas = prontuario.Consultas.Select(c => new ConsultaResponseJson
                {
                    Id = c.Id,
                    DataConsulta = c.DataConsulta,
                    Status = c.Status.ToString()
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