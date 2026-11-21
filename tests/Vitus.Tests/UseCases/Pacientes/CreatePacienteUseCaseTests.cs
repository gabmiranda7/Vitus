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
        private readonly Mock<IAuditoriaService> _auditoriaServiceMock;
        private readonly CreatePacienteUseCase _useCase;

        public CreatePacienteUseCaseTests()
        {
            _repositoryMock = new Mock<IPacienteRepository>();
            _auditoriaServiceMock = new Mock<IAuditoriaService>();
            _useCase = new CreatePacienteUseCase(_repositoryMock.Object, _auditoriaServiceMock.Object);
        }

        private static CreatePacienteRequestJson RequestValido(string nome = "João Silva") => new()
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
            InformacoesAdicionais = null,
            AceitaTermos = true
        };

        [Fact]
        public async Task Execute_Success()
        {
            var request = RequestValido();

            var resultado = await _useCase.Execute(request);

            resultado.Nome.Should().Be("João Silva");
            resultado.Id.Should().NotBeEmpty();
            _repositoryMock.Verify(r => r.Add(It.IsAny<Vitus.Domain.Entities.Paciente>()), Times.Once);
        }

        [Fact]
        public async Task Execute_Success_ComCamposOpcionais()
        {
            var request = RequestValido("Maria Souza");
            request.Cpf = "529.982.247-25";
            request.Sexo = "Feminino";
            request.DataNascimento = new DateOnly(1990, 5, 15);

            var resultado = await _useCase.Execute(request);

            resultado.Nome.Should().Be("Maria Souza");
            resultado.Cpf.Should().Be("529.982.247-25");
            resultado.Sexo.Should().Be("Feminino");
        }

        [Fact]
        public async Task Execute_Success_CpfSoComDigitos_EGravadoFormatado()
        {
            var request = RequestValido();
            request.Cpf = "52998224725";

            var resultado = await _useCase.Execute(request);

            resultado.Cpf.Should().Be("529.982.247-25");
        }

        [Fact]
        public async Task Execute_Fail_EmptyName()
        {
            var request = RequestValido("");

            var act = async () => await _useCase.Execute(request);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Nome é obrigatório");
        }

        [Fact]
        public async Task Execute_Fail_CpfInvalido()
        {
            var request = RequestValido();
            request.Cpf = "123.456.789-00";

            var act = async () => await _useCase.Execute(request);

            await act.Should().ThrowAsync<DomainException>().WithMessage("CPF inválido");
            _repositoryMock.Verify(r => r.Add(It.IsAny<Vitus.Domain.Entities.Paciente>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Fail_CpfJaCadastrado()
        {
            var request = RequestValido();
            request.Cpf = "529.982.247-25";
            _repositoryMock.Setup(r => r.ExisteCpf("529.982.247-25", null)).ReturnsAsync(true);

            var act = async () => await _useCase.Execute(request);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Já existe um paciente cadastrado com este CPF");
            _repositoryMock.Verify(r => r.Add(It.IsAny<Vitus.Domain.Entities.Paciente>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Fail_SemConsentimento()
        {
            var request = RequestValido();
            request.AceitaTermos = false;

            var act = async () => await _useCase.Execute(request);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("O paciente precisa aceitar os termos de uso de dados");
            _repositoryMock.Verify(r => r.Add(It.IsAny<Vitus.Domain.Entities.Paciente>()), Times.Never);
        }
    }
}