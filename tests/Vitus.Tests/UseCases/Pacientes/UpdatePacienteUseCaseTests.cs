using Moq;
using FluentAssertions;
using Vitus.Application.UseCases.Pacientes.UpdatePaciente;
using Vitus.Communication.Paciente.Requests;
using Vitus.Domain.Entities;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Tests.UseCases.Pacientes
{
    public class UpdatePacienteUseCaseTests
    {
        private readonly Mock<IPacienteRepository> _repositoryMock;
        private readonly UpdatePacienteUseCase _useCase;

        public UpdatePacienteUseCaseTests()
        {
            _repositoryMock = new Mock<IPacienteRepository>();
            _useCase = new UpdatePacienteUseCase(_repositoryMock.Object);
        }

        [Fact]
        public async Task Execute_Success()
        {
            var pacienteId = Guid.NewGuid();
            var paciente = new Paciente("João Silva");
            var request = new UpdatePacienteRequestJson { Nome = "João Atualizado" };

            _repositoryMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync(paciente);

            var act = async () => await _useCase.Execute(pacienteId, request);

            await act.Should().NotThrowAsync();
            _repositoryMock.Verify(r => r.Update(paciente), Times.Once);
        }

        [Fact]
        public async Task Execute_Fail_PacienteNotFound()
        {
            var pacienteId = Guid.NewGuid();
            var request = new UpdatePacienteRequestJson { Nome = "João Atualizado" };

            _repositoryMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync((Paciente?)null);

            var act = async () => await _useCase.Execute(pacienteId, request);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Paciente não encontrado.");
        }

        [Fact]
        public async Task Execute_Fail_EmptyName()
        {
            var pacienteId = Guid.NewGuid();
            var paciente = new Paciente("João Silva");
            var request = new UpdatePacienteRequestJson { Nome = "" };

            _repositoryMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync(paciente);

            var act = async () => await _useCase.Execute(pacienteId, request);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Nome é obrigatório");
        }
    }
}