using Moq;
using FluentAssertions;
using Vitus.Application.UseCases.Pacientes.GetAllPacientes;
using Vitus.Domain.Entities;
using Vitus.Domain.Interfaces;

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
        public async Task Execute_Success()
        {
            var pacientes = new List<Paciente>
            {
                new Paciente("João Silva"),
                new Paciente("Maria Souza")
            };

            _repositoryMock.Setup(r => r.GetAll()).ReturnsAsync(pacientes);

            var resultado = await _useCase.Execute();

            resultado.Should().HaveCount(2);
            resultado[0].Nome.Should().Be("João Silva");
            resultado[1].Nome.Should().Be("Maria Souza");
        }

        [Fact]
        public async Task Execute_Success_EmptyList()
        {
            _repositoryMock.Setup(r => r.GetAll()).ReturnsAsync(new List<Paciente>());

            var resultado = await _useCase.Execute();

            resultado.Should().BeEmpty();
        }
    }
}