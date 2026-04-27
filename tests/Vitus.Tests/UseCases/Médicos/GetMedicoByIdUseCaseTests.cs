using Moq;
using FluentAssertions;
using Vitus.Application.UseCases.Medicos.GetMedicoById;
using Vitus.Domain.Entities;
using Vitus.Domain.Interfaces;

namespace Vitus.Tests.UseCases.Medicos
{
    public class GetMedicoByIdUseCaseTests
    {
        private readonly Mock<IMedicoRepository> _repositoryMock;
        private readonly GetMedicoByIdUseCase _useCase;

        public GetMedicoByIdUseCaseTests()
        {
            _repositoryMock = new Mock<IMedicoRepository>();
            _useCase = new GetMedicoByIdUseCase(_repositoryMock.Object);
        }

        [Fact]
        public async Task Execute_Success()
        {
            var medicoId = Guid.NewGuid();
            var medico = new Medico("Dr. Carlos", "Cardiologia", "CRM-MG 12345");

            _repositoryMock.Setup(r => r.GetById(medicoId)).ReturnsAsync(medico);

            var resultado = await _useCase.Execute(medicoId);

            resultado.Should().NotBeNull();
            resultado!.Nome.Should().Be("Dr. Carlos");
            resultado.Especialidade.Should().Be("Cardiologia");
            resultado.CRM.Should().Be("CRM-MG 12345");
        }

        [Fact]
        public async Task Execute_Fail_MedicoNotFound()
        {
            var medicoId = Guid.NewGuid();

            _repositoryMock.Setup(r => r.GetById(medicoId)).ReturnsAsync((Medico?)null);

            var resultado = await _useCase.Execute(medicoId);

            resultado.Should().BeNull();
        }
    }
}