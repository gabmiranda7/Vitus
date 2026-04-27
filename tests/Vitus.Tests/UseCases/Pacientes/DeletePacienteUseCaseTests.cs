using Moq;
using FluentAssertions;
using Vitus.Application.UseCases.Pacientes.DeletePaciente;
using Vitus.Domain.Entities;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Tests.UseCases.Pacientes
{
    public class DeletePacienteUseCaseTests
    {
        private readonly Mock<IPacienteRepository> _repositoryMock;
        private readonly DeletePacienteUseCase _useCase;

        public DeletePacienteUseCaseTests()
        {
            _repositoryMock = new Mock<IPacienteRepository>();
            _useCase = new DeletePacienteUseCase(_repositoryMock.Object);
        }

        [Fact]
        public async Task Execute_Success()
        {
            var pacienteId = Guid.NewGuid();
            var paciente = new Paciente("João Silva");

            _repositoryMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync(paciente);

            var act = async () => await _useCase.Execute(pacienteId);

            await act.Should().NotThrowAsync();
            _repositoryMock.Verify(r => r.Delete(paciente), Times.Once);
        }

        [Fact]
        public async Task Execute_Fail_PacienteNotFound()
        {
            var pacienteId = Guid.NewGuid();

            _repositoryMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync((Paciente?)null);

            var act = async () => await _useCase.Execute(pacienteId);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Paciente não encontrado.");
        }
    }
}