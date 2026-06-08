using Moq;
using FluentAssertions;
using Vitus.Application.UseCases.Triagens.RegistrarTriagem;
using Vitus.Communication.Triagem.Requests;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Tests.UseCases.Triagens
{
    public class RegistrarTriagemUseCaseTests
    {
        private readonly Mock<IConsultaRepository> _consultaRepoMock;
        private readonly Mock<ITriagemRepository> _triagemRepoMock;
        private readonly Mock<IPacienteRepository> _pacienteRepoMock;
        private readonly RegistrarTriagemUseCase _useCase;

        public RegistrarTriagemUseCaseTests()
        {
            _consultaRepoMock = new Mock<IConsultaRepository>();
            _triagemRepoMock = new Mock<ITriagemRepository>();
            _pacienteRepoMock = new Mock<IPacienteRepository>();
            _useCase = new RegistrarTriagemUseCase(
                _consultaRepoMock.Object,
                _triagemRepoMock.Object,
                _pacienteRepoMock.Object
            );
        }

        private static Paciente CriarPaciente()
        {
            var paciente = new Paciente("João Silva", null, null, null, null, null, null, null, null, null, null, true);
            paciente.CriarProntuario();
            return paciente;
        }

        private static Consulta CriarConsulta(Guid pacienteId, Guid medicoId, StatusConsulta status = StatusConsulta.EmTriagem)
        {
            var consulta = new Consulta(pacienteId, medicoId, Guid.NewGuid(), DateTime.UtcNow.AddHours(1));
            if (status == StatusConsulta.EmTriagem)
                consulta.IniciarTriagem();
            return consulta;
        }

        private static CreateTriagemRequestJson RequestValido(Guid consultaId) => new()
        {
            ConsultaId = consultaId,
            PressaoArterial = "120/80",
            Temperatura = 36.5m,
            Observacoes = "Paciente relata dor de cabeça"
        };

        [Fact]
        public async Task Execute_Success()
        {
            var paciente = CriarPaciente();
            var consulta = CriarConsulta(paciente.Id, Guid.NewGuid());

            _consultaRepoMock.Setup(r => r.GetById(consulta.Id)).ReturnsAsync(consulta);
            _pacienteRepoMock.Setup(r => r.GetById(paciente.Id)).ReturnsAsync(paciente);
            _triagemRepoMock.Setup(r => r.Add(It.IsAny<Triagem>())).Returns(Task.CompletedTask);

            var resultado = await _useCase.Execute(RequestValido(consulta.Id), "Enf. Maria");

            resultado.Should().NotBeNull();
            resultado.PressaoArterial.Should().Be("120/80");
            resultado.Temperatura.Should().Be(36.5m);
            resultado.Observacoes.Should().Be("Paciente relata dor de cabeça");
            resultado.NomeEnfermeiro.Should().Be("Enf. Maria");
            _triagemRepoMock.Verify(r => r.Add(It.IsAny<Triagem>()), Times.Once);
        }

        [Fact]
        public async Task Execute_Fail_ConsultaNaoEncontrada()
        {
            _consultaRepoMock.Setup(r => r.GetById(It.IsAny<Guid>()))
                .ReturnsAsync((Consulta?)null);

            var act = async () => await _useCase.Execute(RequestValido(Guid.NewGuid()), "Enf. Maria");

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Consulta não encontrada");
        }

        [Fact]
        public async Task Execute_Fail_ConsultaNaoEstaEmTriagem()
        {
            var paciente = CriarPaciente();
            var consulta = CriarConsulta(paciente.Id, Guid.NewGuid(), StatusConsulta.Agendada);

            _consultaRepoMock.Setup(r => r.GetById(consulta.Id)).ReturnsAsync(consulta);

            var act = async () => await _useCase.Execute(RequestValido(consulta.Id), "Enf. Maria");

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Consulta não está em triagem");
        }

        [Fact]
        public async Task Execute_Fail_PacienteNaoEncontrado()
        {
            var consulta = CriarConsulta(Guid.NewGuid(), Guid.NewGuid());

            _consultaRepoMock.Setup(r => r.GetById(consulta.Id)).ReturnsAsync(consulta);
            _pacienteRepoMock.Setup(r => r.GetById(It.IsAny<Guid>()))
                .ReturnsAsync((Paciente?)null);

            var act = async () => await _useCase.Execute(RequestValido(consulta.Id), "Enf. Maria");

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Paciente não encontrado");
        }
    }
}