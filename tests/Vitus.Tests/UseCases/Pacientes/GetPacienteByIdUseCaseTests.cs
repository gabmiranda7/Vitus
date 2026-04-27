using Moq;
using FluentAssertions;
using Vitus.Application.UseCases.Pacientes.GetPacienteById;
using Vitus.Domain.Entities;
using Vitus.Domain.Interfaces;

namespace Vitus.Tests.UseCases.Pacientes
{
    public class GetPacienteByIdUseCaseTests
    {
        private readonly Mock<IPacienteRepository> _repositoryMock;
        private readonly GetPacienteByIdUseCase _useCase;

        public GetPacienteByIdUseCaseTests()
        {
            _repositoryMock = new Mock<IPacienteRepository>();
            _useCase = new GetPacienteByIdUseCase(_repositoryMock.Object);
        }

        [Fact]
        public async Task Execute_Success()
        {
            var pacienteId = Guid.NewGuid();
            var paciente = new Paciente("João Silva");

            _repositoryMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync(paciente);

            var resultado = await _useCase.Execute(pacienteId);

            resultado.Should().NotBeNull();
            resultado!.Nome.Should().Be("João Silva");
        }

        [Fact]
        public async Task Execute_Fail_PacienteNotFound()
        {
            var pacienteId = Guid.NewGuid();

            _repositoryMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync((Paciente?)null);

            var resultado = await _useCase.Execute(pacienteId);

            resultado.Should().BeNull();
        }
    }
}