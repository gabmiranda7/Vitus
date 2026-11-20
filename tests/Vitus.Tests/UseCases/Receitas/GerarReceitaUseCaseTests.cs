using FluentAssertions;
using Moq;
using Vitus.Application.UseCases.Receitas.GerarReceita;
using Vitus.Communication.Receita.Requests;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;
using Vitus.Tests.Helpers;

namespace Vitus.Tests.UseCases.Receitas
{
    public class GerarReceitaUseCaseTests
    {
        private readonly Mock<IConsultaRepository> _consultaRepoMock = new();
        private readonly Mock<IPacienteRepository> _pacienteRepoMock = new();
        private readonly Mock<IMedicoRepository> _medicoRepoMock = new();
        private readonly Mock<IProntuarioRepository> _prontuarioRepoMock = new();
        private readonly Mock<IReceitaRepository> _receitaRepoMock = new();
        private readonly Mock<IDocumentoService> _documentoMock = new();
        private readonly Mock<IAuditoriaService> _auditoriaMock = new();
        private readonly Mock<IConsultaAcessoService> _acessoMock = new();
        private readonly GerarReceitaUseCase _useCase;

        public GerarReceitaUseCaseTests()
        {
            _useCase = new GerarReceitaUseCase(
                _consultaRepoMock.Object,
                _pacienteRepoMock.Object,
                _medicoRepoMock.Object,
                _prontuarioRepoMock.Object,
                _receitaRepoMock.Object,
                _documentoMock.Object,
                _auditoriaMock.Object,
                _acessoMock.Object);
        }

        private Consulta CenarioEmAtendimento()
        {
            var paciente = EntidadeFactory.CriarPaciente();
            var medico = EntidadeFactory.CriarMedico();
            var consulta = EntidadeFactory.CriarConsultaEmAtendimento(paciente.Id, medico.Id);

            _consultaRepoMock.Setup(r => r.GetById(consulta.Id)).ReturnsAsync(consulta);
            _pacienteRepoMock.Setup(r => r.GetById(paciente.Id)).ReturnsAsync(paciente);
            _medicoRepoMock.Setup(r => r.GetById(medico.Id)).ReturnsAsync(medico);
            _prontuarioRepoMock.Setup(r => r.GetByPacienteId(paciente.Id)).ReturnsAsync(paciente.Prontuario);

            return consulta;
        }

        private void ConfigurarDocumento(Action? aoGerar = null, byte[]? conteudo = null)
        {
            _documentoMock.Setup(d => d.GerarReceita(
                    It.IsAny<TipoReceita>(), It.IsAny<TipoUso>(), It.IsAny<string>(), It.IsAny<string?>(),
                    It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<List<(string Medicamento, string Posologia)>>()))
                .Callback(() => aoGerar?.Invoke())
                .ReturnsAsync(conteudo ?? new byte[] { 1, 2, 3 });
        }

        private static GerarReceitaRequestJson Request(Guid consultaId, bool acompanharSemValidade = false) => new()
        {
            ConsultaId = consultaId,
            TipoReceita = "Comum",
            TipoUso = "Oral",
            Medicamentos = new List<MedicamentoRequestJson>
            {
                new()
                {
                    Nome = "Losartana",
                    Dosagem = "50mg",
                    Posologia = "1 cp ao dia",
                    Quantidade = "30 cps",
                    AcompanharVencimento = acompanharSemValidade,
                    ValidadeDias = null
                }
            }
        };

        [Fact]
        public async Task Execute_Success_GeraDocumentoAntesDeGravar()
        {
            var consulta = CenarioEmAtendimento();
            var ordem = new List<string>();
            ConfigurarDocumento(() => ordem.Add("gerar"), new byte[] { 9, 9 });
            _receitaRepoMock.Setup(r => r.Add(It.IsAny<Receita>()))
                .Callback(() => ordem.Add("salvar"))
                .Returns(Task.CompletedTask);

            var (arquivo, nomeArquivo) = await _useCase.Execute(Request(consulta.Id));

            ordem.Should().Equal("gerar", "salvar");
            arquivo.Should().Equal(new byte[] { 9, 9 });
            nomeArquivo.Should().StartWith("Receita_Comum_João_Silva_").And.EndWith(".docx");
            _auditoriaMock.Verify(a => a.Registrar(
                AcaoAuditoria.EmissaoReceita, "Receita", It.IsAny<Guid>(), It.IsAny<string?>()), Times.Once);
        }

        [Fact]
        public async Task Execute_Fail_FalhaAoGerarDocumento_NaoGravaReceita()
        {
            var consulta = CenarioEmAtendimento();
            _documentoMock.Setup(d => d.GerarReceita(
                    It.IsAny<TipoReceita>(), It.IsAny<TipoUso>(), It.IsAny<string>(), It.IsAny<string?>(),
                    It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<List<(string Medicamento, string Posologia)>>()))
                .ThrowsAsync(new FileNotFoundException("template ausente"));

            var act = async () => await _useCase.Execute(Request(consulta.Id));

            await act.Should().ThrowAsync<FileNotFoundException>();
            _receitaRepoMock.Verify(r => r.Add(It.IsAny<Receita>()), Times.Never);
            _auditoriaMock.Verify(a => a.Registrar(
                It.IsAny<AcaoAuditoria>(), It.IsAny<string>(), It.IsAny<Guid>(), It.IsAny<string?>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Fail_ConsultaForaDoAtendimento()
        {
            var consulta = EntidadeFactory.CriarConsulta();
            _consultaRepoMock.Setup(r => r.GetById(consulta.Id)).ReturnsAsync(consulta);

            var act = async () => await _useCase.Execute(Request(consulta.Id));

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Receita só pode ser criada durante o atendimento");
            _documentoMock.VerifyNoOtherCalls();
            _receitaRepoMock.Verify(r => r.Add(It.IsAny<Receita>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Fail_MedicamentoInvalido_NaoGeraNemGrava()
        {
            var consulta = CenarioEmAtendimento();

            var act = async () => await _useCase.Execute(Request(consulta.Id, acompanharSemValidade: true));

            await act.Should().ThrowAsync<DomainException>();
            _documentoMock.VerifyNoOtherCalls();
            _receitaRepoMock.Verify(r => r.Add(It.IsAny<Receita>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Fail_MedicoNaoResponsavel()
        {
            var consulta = CenarioEmAtendimento();
            _acessoMock.Setup(a => a.GarantirMedicoResponsavel(consulta))
                .ThrowsAsync(new AcessoNegadoException("Você só pode realizar esta ação em consultas atribuídas a você"));

            var act = async () => await _useCase.Execute(Request(consulta.Id));

            await act.Should().ThrowAsync<AcessoNegadoException>();
            _receitaRepoMock.Verify(r => r.Add(It.IsAny<Receita>()), Times.Never);
        }
    }
}