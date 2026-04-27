using Moq;
using FluentAssertions;
using Vitus.Application.UseCases.Medicos.CreateMedico;
using Vitus.Communication.Medico.Requests;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Tests.UseCases.Medicos
{
    public class CreateMedicoUseCaseTests
    {
        private readonly Mock<IMedicoRepository> _repositoryMock;
        private readonly CreateMedicoUseCase _useCase;

        public CreateMedicoUseCaseTests()
        {
            _repositoryMock = new Mock<IMedicoRepository>();
            _useCase = new CreateMedicoUseCase(_repositoryMock.Object);
        }

        [Fact]
        public async Task Execute_Success()
        {
            var request = new CreateMedicoRequestJson
            {
                Nome = "Dr. Carlos",
                Especialidade = "Cardiologia",
                CRM = "CRM-MG 12345"
            };

            var act = async () => await _useCase.Execute(request);

            await act.Should().NotThrowAsync();
            _repositoryMock.Verify(r => r.Add(It.IsAny<Vitus.Domain.Entities.Medico>()), Times.Once);
        }

        [Fact]
        public async Task Execute_Fail_EmptyName()
        {
            var request = new CreateMedicoRequestJson
            {
                Nome = "",
                Especialidade = "Cardiologia",
                CRM = "CRM-MG 12345"
            };

            var act = async () => await _useCase.Execute(request);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Nome é obrigatório");
        }

        [Fact]
        public async Task Execute_Fail_EmptyEspecialidade()
        {
            var request = new CreateMedicoRequestJson
            {
                Nome = "Dr. Carlos",
                Especialidade = "",
                CRM = "CRM-MG 12345"
            };

            var act = async () => await _useCase.Execute(request);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Especialidade é obrigatória");
        }

        [Fact]
        public async Task Execute_Fail_EmptyCRM()
        {
            var request = new CreateMedicoRequestJson
            {
                Nome = "Dr. Carlos",
                Especialidade = "Cardiologia",
                CRM = ""
            };

            var act = async () => await _useCase.Execute(request);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("CRM é obrigatório");
        }
    }
}