using Moq;
using FluentAssertions;
using Vitus.Application.UseCases.Pacientes.GetAllPacientes;
using Vitus.Domain.Entities;
using Vitus.Domain.Interfaces;
using Vitus.Tests.Helpers;

namespace Vitus.Tests.UseCases.Pacientes
{
    public class GetAllPacientesUseCaseTests
    {
        private readonly Mock<IPacienteRepository> _repositoryMock;
        private readonly GetAllPacientesUseCase _useCase;

        public GetAllPacientesUseCaseTests()
        {
            _repositoryMock = new Mock<IPacienteRepository>();
            _useCase = new GetAllPacientesUseCase(_repositoryMock.Object);
        }

        [Fact]
        public async Task Execute_Success_ListaSoAtivosPorPadrao()
        {
            var pacientes = new List<Paciente>
            {
                EntidadeFactory.CriarPaciente("João Silva"),
                EntidadeFactory.CriarPaciente("Maria Souza")
            };

            _repositoryMock.Setup(r => r.GetAtivos()).ReturnsAsync(pacientes);

            var resultado = await _useCase.Execute();

            resultado.Should().HaveCount(2);
            resultado[0].Nome.Should().Be("João Silva");
            resultado[1].Nome.Should().Be("Maria Souza");
            resultado.Should().OnlyContain(p => p.Ativo);
            _repositoryMock.Verify(r => r.GetAll(), Times.Never);
        }

        [Fact]
        public async Task Execute_Success_IncluiInativosQuandoPedido()
        {
            var inativo = EntidadeFactory.CriarPaciente("Carlos Lima");
            inativo.Inativar();
            var pacientes = new List<Paciente> { EntidadeFactory.CriarPaciente("João Silva"), inativo };

            _repositoryMock.Setup(r => r.GetAll()).ReturnsAsync(pacientes);

            var resultado = await _useCase.Execute(incluirInativos: true);

            resultado.Should().HaveCount(2);
            resultado.Single(p => p.Nome == "Carlos Lima").Ativo.Should().BeFalse();
            _repositoryMock.Verify(r => r.GetAtivos(), Times.Never);
        }

        [Fact]
        public async Task Execute_Success_EmptyList()
        {
            _repositoryMock.Setup(r => r.GetAtivos()).ReturnsAsync(new List<Paciente>());

            var resultado = await _useCase.Execute();

            resultado.Should().BeEmpty();
        }
    }
}