using Moq;
using FluentAssertions;
using Vitus.Application.UseCases.Medicos.GetAllMedicos;
using Vitus.Domain.Entities;
using Vitus.Domain.Interfaces;

namespace Vitus.Tests.UseCases.Medicos
{
    public class GetAllMedicosUseCaseTests
    {
        private readonly Mock<IMedicoRepository> _repositoryMock;
        private readonly GetAllMedicosUseCase _useCase;

        public GetAllMedicosUseCaseTests()
        {
            _repositoryMock = new Mock<IMedicoRepository>();
            _useCase = new GetAllMedicosUseCase(_repositoryMock.Object);
        }

        [Fact]
        public async Task Execute_Success()
        {
            var medicos = new List<Medico>
            {
                new Medico("Dr. Carlos", "Cardiologia", "CRM-MG 12345"),
                new Medico("Dra. Ana", "Pediatria", "CRM-SP 67890")
            };

            _repositoryMock.Setup(r => r.GetAll()).ReturnsAsync(medicos);

            var resultado = await _useCase.Execute();

            resultado.Should().HaveCount(2);
            resultado[0].Nome.Should().Be("Dr. Carlos");
            resultado[1].Nome.Should().Be("Dra. Ana");
        }

        [Fact]
        public async Task Execute_Success_EmptyList()
        {
            _repositoryMock.Setup(r => r.GetAll()).ReturnsAsync(new List<Medico>());

            var resultado = await _useCase.Execute();

            resultado.Should().BeEmpty();
        }
    }
}