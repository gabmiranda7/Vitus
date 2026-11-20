using FluentAssertions;
using Moq;
using Vitus.Application.UseCases.Consultas.GetConsultaById;
using Vitus.Domain.Entities;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;
using Vitus.Tests.Helpers;

namespace Vitus.Tests.UseCases.Consultas
{
    public class GetConsultaByIdUseCaseTests
    {
        private readonly Mock<IConsultaRepository> _consultaRepoMock = new();
        private readonly Mock<IPacienteRepository> _pacienteRepoMock = new();
        private readonly Mock<IMedicoRepository> _medicoRepoMock = new();
        private readonly Mock<IConsultaAcessoService> _acessoMock = new();
        private readonly GetConsultaByIdUseCase _useCase;

        public GetConsultaByIdUseCaseTests()
        {
            _useCase = new GetConsultaByIdUseCase(
                _consultaRepoMock.Object,
                _pacienteRepoMock.Object,
                _medicoRepoMock.Object,
                _acessoMock.Object);
        }

        private Consulta CenarioConsulta()
        {
            var paciente = EntidadeFactory.CriarPaciente();
            var medico = EntidadeFactory.CriarMedico();
            var consulta = EntidadeFactory.CriarConsulta(paciente.Id, medico.Id);

            _consultaRepoMock.Setup(r => r.GetById(consulta.Id)).ReturnsAsync(consulta);
            _pacienteRepoMock.Setup(r => r.GetById(paciente.Id)).ReturnsAsync(paciente);
            _medicoRepoMock.Setup(r => r.GetById(medico.Id)).ReturnsAsync(medico);

            return consulta;
        }

        [Fact]
        public async Task Execute_Success()
        {
            var consulta = CenarioConsulta();

            var resultado = await _useCase.Execute(consulta.Id);

            resultado.Should().NotBeNull();
            resultado!.Id.Should().Be(consulta.Id);
            _acessoMock.Verify(a => a.GarantirResponsavelSeMedico(consulta), Times.Once);
        }

        [Fact]
        public async Task Execute_Fail_ConsultaDeOutroMedico()
        {
            var consulta = CenarioConsulta();
            _acessoMock.Setup(a => a.GarantirResponsavelSeMedico(consulta))
                .ThrowsAsync(new AcessoNegadoException("Você só pode realizar esta ação em consultas atribuídas a você"));

            var act = async () => await _useCase.Execute(consulta.Id);

            await act.Should().ThrowAsync<AcessoNegadoException>();
        }

        [Fact]
        public async Task Execute_ConsultaNaoEncontrada_RetornaNulo()
        {
            _consultaRepoMock.Setup(r => r.GetById(It.IsAny<Guid>())).ReturnsAsync((Consulta?)null);

            var resultado = await _useCase.Execute(Guid.NewGuid());

            resultado.Should().BeNull();
            _acessoMock.Verify(a => a.GarantirResponsavelSeMedico(It.IsAny<Consulta>()), Times.Never);
        }
    }
}