using Moq;
using FluentAssertions;
using Vitus.Application.UseCases.Pacientes.UpdatePaciente;
using Vitus.Communication.Paciente.Requests;
using Vitus.Domain.Entities;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;
using Vitus.Tests.Helpers;

namespace Vitus.Tests.UseCases.Pacientes
{
    public class UpdatePacienteUseCaseTests
    {
        private readonly Mock<IPacienteRepository> _repositoryMock;
        private readonly Mock<IAuditoriaService> _auditoriaServiceMock;
        private readonly UpdatePacienteUseCase _useCase;

        public UpdatePacienteUseCaseTests()
        {
            _repositoryMock = new Mock<IPacienteRepository>();
            _auditoriaServiceMock = new Mock<IAuditoriaService>();
            _useCase = new UpdatePacienteUseCase(_repositoryMock.Object, _auditoriaServiceMock.Object);
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
                .ReturnsAsync((Paciente?)null);

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

        [Fact]
        public async Task Execute_Fail_CpfInvalido()
        {
            var pacienteId = Guid.NewGuid();
            var paciente = EntidadeFactory.CriarPaciente();
            var request = RequestValido();
            request.Cpf = "123.456.789-00";

            _repositoryMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync(paciente);

            var act = async () => await _useCase.Execute(pacienteId, request);

            await act.Should().ThrowAsync<DomainException>().WithMessage("CPF inválido");
            _repositoryMock.Verify(r => r.Update(It.IsAny<Paciente>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Fail_CpfJaUsadoPorOutroPaciente()
        {
            var pacienteId = Guid.NewGuid();
            var paciente = EntidadeFactory.CriarPaciente();
            var request = RequestValido();
            request.Cpf = "111.444.777-35";

            _repositoryMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync(paciente);
            _repositoryMock.Setup(r => r.ExisteCpf("111.444.777-35", paciente.Id)).ReturnsAsync(true);

            var act = async () => await _useCase.Execute(pacienteId, request);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Já existe um paciente cadastrado com este CPF");
            _repositoryMock.Verify(r => r.Update(It.IsAny<Paciente>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Success_CpfInalterado_NaoConsultaDuplicidade()
        {
            var pacienteId = Guid.NewGuid();
            var paciente = new Paciente("João Silva", "529.982.247-25", null, null, null, null, null, null, null, null, null, true);
            var request = RequestValido();
            request.Cpf = "52998224725";

            _repositoryMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync(paciente);

            var act = async () => await _useCase.Execute(pacienteId, request);

            await act.Should().NotThrowAsync();
            paciente.Cpf.Should().Be("529.982.247-25");
            _repositoryMock.Verify(r => r.ExisteCpf(It.IsAny<string>(), It.IsAny<Guid?>()), Times.Never);
            _repositoryMock.Verify(r => r.Update(paciente), Times.Once);
        }
    }
}