using Moq;
using FluentAssertions;
using Vitus.Application.UseCases.Pacientes.CreatePaciente;
using Vitus.Communication.Paciente.Requests;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Tests.UseCases.Pacientes
{
    public class CreatePacienteUseCaseTests
    {
        private readonly Mock<IPacienteRepository> _repositoryMock;
        private readonly CreatePacienteUseCase _useCase;

        public CreatePacienteUseCaseTests()
        {
            _repositoryMock = new Mock<IPacienteRepository>();
            _useCase = new CreatePacienteUseCase(_repositoryMock.Object);
        }

        [Fact]
        public async Task Execute_Success()
        {
            var request = new CreatePacienteRequestJson { Nome = "João Silva" };

            var resultado = await _useCase.Execute(request);

            resultado.Nome.Should().Be("João Silva");
            resultado.Id.Should().NotBeEmpty();
            _repositoryMock.Verify(r => r.Add(It.IsAny<Vitus.Domain.Entities.Paciente>()), Times.Once);
        }

        [Fact]
        public async Task Execute_Fail_EmptyName()
        {
            var request = new CreatePacienteRequestJson { Nome = "" };

            var act = async () => await _useCase.Execute(request);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Nome é obrigatório");
        }
    }
}