using FluentAssertions;
using Moq;
using Vitus.Application.UseCases.Prontuarios.GetAcompanhamentoReceitas;
using Vitus.Domain.Entities;
using Vitus.Domain.Interfaces;

namespace Vitus.Tests.UseCases.Prontuarios
{
    public class GetAcompanhamentoReceitasUseCaseTests
    {
        private readonly Mock<IProntuarioRepository> _repoMock = new();
        private readonly GetAcompanhamentoReceitasUseCase _useCase;

        public GetAcompanhamentoReceitasUseCaseTests()
        {
            _useCase = new GetAcompanhamentoReceitasUseCase(_repoMock.Object);
        }

        private static Prontuario ProntuarioComReceita(int diasAtras, bool acompanhar, int? validade)
        {
            var prontuario = new Prontuario(Guid.NewGuid());
            var receita = new Receita(Guid.NewGuid(), prontuario.Id, DateTime.UtcNow.AddDays(-diasAtras));
            receita.AdicionarMedicamento("Losartana", "50mg", "1 cp ao dia", "30 cps", acompanhar, validade);
            prontuario.AdicionarReceita(receita);
            return prontuario;
        }

        [Fact]
        public async Task Retorna_so_pacientes_com_tratamento_acompanhado()
        {
            var comAlerta = ProntuarioComReceita(5, true, 30);
            var semAlerta = ProntuarioComReceita(5, false, null);
            _repoMock.Setup(r => r.GetAllComReceitas())
                .ReturnsAsync(new List<Prontuario> { comAlerta, semAlerta });

            var resultado = await _useCase.Execute();

            resultado.Should().ContainSingle();
            resultado[0].PacienteId.Should().Be(comAlerta.PacienteId);
            resultado[0].Tratamentos[0].DiasRestantes.Should().Be(25);
        }

        [Fact]
        public async Task Ordena_pelo_vencimento_mais_proximo()
        {
            var folgado = ProntuarioComReceita(1, true, 180);
            var vencida = ProntuarioComReceita(40, true, 30);
            _repoMock.Setup(r => r.GetAllComReceitas())
                .ReturnsAsync(new List<Prontuario> { folgado, vencida });

            var resultado = await _useCase.Execute();

            resultado.Select(x => x.PacienteId).Should().ContainInOrder(vencida.PacienteId, folgado.PacienteId);
            resultado[0].Tratamentos[0].DiasRestantes.Should().Be(-10);
        }
    }
}