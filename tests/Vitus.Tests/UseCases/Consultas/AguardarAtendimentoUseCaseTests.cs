using FluentAssertions;
using Moq;
using Vitus.Application.UseCases.Consultas.AguardarAtendimento;
using Vitus.Domain.Entities;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;
using Vitus.Tests.Helpers;

namespace Vitus.Tests.UseCases.Consultas
{
    public class AguardarAtendimentoUseCaseTests
    {
        private readonly Mock<IConsultaRepository> _consultaRepoMock = new();
        private readonly Mock<IPacienteRepository> _pacienteRepoMock = new();
        private readonly Mock<IMedicoRepository> _medicoRepoMock = new();
        private readonly Mock<ITriagemRepository> _triagemRepoMock = new();
        private readonly AguardarAtendimentoUseCase _useCase;

        public AguardarAtendimentoUseCaseTests()
        {
            _useCase = new AguardarAtendimentoUseCase(
                _consultaRepoMock.Object,
                _pacienteRepoMock.Object,
                _medicoRepoMock.Object,
                _triagemRepoMock.Object);
        }

        [Fact]
        public async Task Execute_Success_ComTriagemRegistrada()
        {
            var paciente = EntidadeFactory.CriarPaciente();
            var medico = EntidadeFactory.CriarMedico();
            var consulta = EntidadeFactory.CriarConsultaEmTriagem(paciente.Id, medico.Id);

            _consultaRepoMock.Setup(r => r.GetById(consulta.Id)).ReturnsAsync(consulta);
            _pacienteRepoMock.Setup(r => r.GetById(paciente.Id)).ReturnsAsync(paciente);
            _medicoRepoMock.Setup(r => r.GetById(medico.Id)).ReturnsAsync(medico);
            _triagemRepoMock.Setup(r => r.ExistePorConsulta(consulta.Id)).ReturnsAsync(true);

            var resultado = await _useCase.Execute(consulta.Id);

            resultado.Status.Should().Be("AguardandoAtendimento");
            _consultaRepoMock.Verify(r => r.Update(consulta), Times.Once);
        }

        [Fact]
        public async Task Execute_Fail_SemTriagemRegistrada()
        {
            var consulta = EntidadeFactory.CriarConsultaEmTriagem();

            _consultaRepoMock.Setup(r => r.GetById(consulta.Id)).ReturnsAsync(consulta);
            _triagemRepoMock.Setup(r => r.ExistePorConsulta(consulta.Id)).ReturnsAsync(false);

            var act = async () => await _useCase.Execute(consulta.Id);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Registre a triagem antes de encaminhar o paciente para atendimento");
            _consultaRepoMock.Verify(r => r.Update(It.IsAny<Consulta>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Fail_ConsultaNaoEncontrada()
        {
            _consultaRepoMock.Setup(r => r.GetById(It.IsAny<Guid>())).ReturnsAsync((Consulta?)null);

            var act = async () => await _useCase.Execute(Guid.NewGuid());

            await act.Should().ThrowAsync<DomainException>().WithMessage("Consulta não encontrada");
        }
    }
}