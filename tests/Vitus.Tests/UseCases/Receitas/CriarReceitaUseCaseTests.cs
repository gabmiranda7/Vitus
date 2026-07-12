using Moq;
using FluentAssertions;
using Vitus.Application.UseCases.Receitas.CriarReceita;
using Vitus.Communication.Receita.Requests;
using Vitus.Domain.Entities;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;
using Vitus.Tests.Helpers;

namespace Vitus.Tests.UseCases.Receitas
{
    public class CriarReceitaUseCaseTests
    {
        private readonly Mock<IConsultaRepository> _consultaRepoMock;
        private readonly Mock<IPacienteRepository> _pacienteRepoMock;
        private readonly Mock<IProntuarioRepository> _prontuarioRepoMock;
        private readonly Mock<IReceitaRepository> _receitaRepoMock;
        private readonly Mock<IAuditoriaService> _auditoriaServiceMock;
        private readonly CriarReceitaUseCase _useCase;

        public CriarReceitaUseCaseTests()
        {
            _consultaRepoMock = new Mock<IConsultaRepository>();
            _pacienteRepoMock = new Mock<IPacienteRepository>();
            _prontuarioRepoMock = new Mock<IProntuarioRepository>();
            _receitaRepoMock = new Mock<IReceitaRepository>();
            _auditoriaServiceMock = new Mock<IAuditoriaService>();
            _useCase = new CriarReceitaUseCase(
                _consultaRepoMock.Object,
                _pacienteRepoMock.Object,
                _prontuarioRepoMock.Object,
                _receitaRepoMock.Object,
                _auditoriaServiceMock.Object
            );
        }

        private static CreateReceitaRequestJson RequestValido(Guid consultaId) => new()
        {
            ConsultaId = consultaId,
            Medicamentos = new List<CreateMedicamentoRequestJson>
            {
                new() { Nome = "Dipirona", Dosagem = "500mg", Posologia = "1 cp de 8/8h" },
                new() { Nome = "Ibuprofeno", Dosagem = "400mg", Posologia = "1 cp de 12/12h" }
            }
        };

        [Fact]
        public async Task Execute_Success()
        {
            var paciente = EntidadeFactory.CriarPaciente();
            var consulta = EntidadeFactory.CriarConsultaEmAtendimento(paciente.Id);

            _consultaRepoMock.Setup(r => r.GetById(consulta.Id)).ReturnsAsync(consulta);
            _pacienteRepoMock.Setup(r => r.GetById(paciente.Id)).ReturnsAsync(paciente);
            _receitaRepoMock.Setup(r => r.Add(It.IsAny<Receita>())).Returns(Task.CompletedTask);

            var resultado = await _useCase.Execute(RequestValido(consulta.Id));

            resultado.Should().NotBeNull();
            resultado.ConsultaId.Should().Be(consulta.Id);
            resultado.Medicamentos.Should().HaveCount(2);
            resultado.Medicamentos[0].Nome.Should().Be("Dipirona");
            resultado.Medicamentos[1].Nome.Should().Be("Ibuprofeno");
            _receitaRepoMock.Verify(r => r.Add(It.IsAny<Receita>()), Times.Once);
        }

        [Fact]
        public async Task Execute_Success_MedicamentoUnico()
        {
            var paciente = EntidadeFactory.CriarPaciente();
            var consulta = EntidadeFactory.CriarConsultaEmAtendimento(paciente.Id);

            _consultaRepoMock.Setup(r => r.GetById(consulta.Id)).ReturnsAsync(consulta);
            _pacienteRepoMock.Setup(r => r.GetById(paciente.Id)).ReturnsAsync(paciente);
            _receitaRepoMock.Setup(r => r.Add(It.IsAny<Receita>())).Returns(Task.CompletedTask);

            var request = new CreateReceitaRequestJson
            {
                ConsultaId = consulta.Id,
                Medicamentos = new List<CreateMedicamentoRequestJson>
                {
                    new() { Nome = "Amoxicilina", Dosagem = "875mg", Posologia = "1 cp de 12/12h por 7 dias" }
                }
            };

            var resultado = await _useCase.Execute(request);

            resultado.Medicamentos.Should().HaveCount(1);
            resultado.Medicamentos[0].Nome.Should().Be("Amoxicilina");
        }

        [Fact]
        public async Task Execute_Fail_ConsultaNaoEncontrada()
        {
            _consultaRepoMock.Setup(r => r.GetById(It.IsAny<Guid>()))
                .ReturnsAsync((Consulta?)null);

            var act = async () => await _useCase.Execute(RequestValido(Guid.NewGuid()));

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Consulta não encontrada");
        }

        [Fact]
        public async Task Execute_Fail_ConsultaNaoEstaEmAtendimento()
        {
            var consulta = EntidadeFactory.CriarConsulta();

            _consultaRepoMock.Setup(r => r.GetById(consulta.Id)).ReturnsAsync(consulta);

            var act = async () => await _useCase.Execute(RequestValido(consulta.Id));

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Receita só pode ser criada durante o atendimento");
        }

        [Fact]
        public async Task Execute_Fail_PacienteNaoEncontrado()
        {
            var consulta = EntidadeFactory.CriarConsultaEmAtendimento();

            _consultaRepoMock.Setup(r => r.GetById(consulta.Id)).ReturnsAsync(consulta);
            _pacienteRepoMock.Setup(r => r.GetById(It.IsAny<Guid>()))
                .ReturnsAsync((Paciente?)null);

            var act = async () => await _useCase.Execute(RequestValido(consulta.Id));

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Paciente não encontrado");
        }
    }
}