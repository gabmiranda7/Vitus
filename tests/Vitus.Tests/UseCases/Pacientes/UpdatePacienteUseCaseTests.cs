using Moq;
using FluentAssertions;
using Vitus.Application.UseCases.Pacientes.UpdatePaciente;
using Vitus.Communication.Paciente.Requests;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;
using Vitus.Tests.Helpers;

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

        private static UpdatePacienteRequestJson RequestValido(string nome = "João Atualizado") => new()
        {
            Nome = nome,
            Cpf = null,
            CartaoSus = null,
            DataNascimento = null,
            Sexo = null,
            NomePai = null,
            NomeMae = null,
            Endereco = null,
            Profissao = null,
            EstadoCivil = null,
            InformacoesAdicionais = null
        };

        [Fact]
        public async Task Execute_Success()
        {
            var pacienteId = Guid.NewGuid();
            var paciente = EntidadeFactory.CriarPaciente();
            var request = RequestValido();

            _repositoryMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync(paciente);

            var act = async () => await _useCase.Execute(pacienteId, request);

            await act.Should().NotThrowAsync();
            _repositoryMock.Verify(r => r.Update(paciente), Times.Once);
        }

        [Fact]
        public async Task Execute_Fail_PacienteNotFound()
        {
            var pacienteId = Guid.NewGuid();

            _repositoryMock.Setup(r => r.GetById(pacienteId))
                .ReturnsAsync((Vitus.Domain.Entities.Paciente?)null);

            var act = async () => await _useCase.Execute(pacienteId, RequestValido());

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Paciente não encontrado.");
        }

        [Fact]
        public async Task Execute_Fail_EmptyName()
        {
            var pacienteId = Guid.NewGuid();
            var paciente = EntidadeFactory.CriarPaciente();

            _repositoryMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync(paciente);

            var act = async () => await _useCase.Execute(pacienteId, RequestValido(""));

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Nome é obrigatório");
        }
    }
}