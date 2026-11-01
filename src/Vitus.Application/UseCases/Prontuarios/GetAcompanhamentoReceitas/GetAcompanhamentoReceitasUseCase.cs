using Vitus.Application.UseCases.Receitas.Acompanhamento;
using Vitus.Communication.Prontuario.Responses;
using Vitus.Domain.Interfaces;
using Vitus.Domain.ValueObjects;

namespace Vitus.Application.UseCases.Prontuarios.GetAcompanhamentoReceitas
{
    public class GetAcompanhamentoReceitasUseCase
    {
        private readonly IProntuarioRepository _prontuarioRepository;

        public GetAcompanhamentoReceitasUseCase(IProntuarioRepository prontuarioRepository)
        {
            _prontuarioRepository = prontuarioRepository;
        }

        public async Task<List<AcompanhamentoPacienteResponseJson>> Execute()
        {
            var prontuarios = await _prontuarioRepository.GetAllComReceitas();
            var hoje = AcompanhamentoReceitas.Hoje();

            return prontuarios
                .Select(p => (Prontuario: p, Tratamentos: AcompanhamentoReceitas.Calcular(p.Receitas, hoje)))
                .Where(x => x.Tratamentos.Count > 0)
                .Select(x => new AcompanhamentoPacienteResponseJson
                {
                    PacienteId = x.Prontuario.PacienteId,
                    ProntuarioId = x.Prontuario.Id,
                    Tratamentos = x.Tratamentos.Select(MapToResponse).ToList()
                })
                .OrderBy(x => x.Tratamentos[0].DiasRestantes)
                .ToList();
        }

        public static TratamentoAcompanhadoResponseJson MapToResponse(TratamentoAcompanhado t) => new()
        {
            Medicamento = t.Medicamento,
            ReceitaId = t.ReceitaId,
            DataEmissao = t.DataEmissao,
            ValidadeDias = t.ValidadeDias,
            DataVencimento = t.DataVencimento,
            DiasRestantes = t.DiasRestantes
        };
    }
}