namespace Vitus.Domain.ValueObjects
{
    public record TratamentoAcompanhado(
        string Medicamento,
        Guid ReceitaId,
        DateTime DataEmissao,
        int ValidadeDias,
        DateOnly DataVencimento,
        int DiasRestantes);
}