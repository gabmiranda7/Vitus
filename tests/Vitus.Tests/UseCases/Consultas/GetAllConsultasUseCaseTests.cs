using FluentAssertions;
using Moq;
using Vitus.Application.UseCases.Consultas.GetAllConsultas;
using Vitus.Domain.Entities;
using Vitus.Domain.Interfaces;
using Vitus.Tests.Helpers;

namespace Vitus.Tests.UseCases.Consultas
{
    public class GetAllConsultasUseCaseTests
    {
        private readonly Mock<IConsultaRepository> _consultaRepoMock = new();
        private readonly Mock<IPacienteRepository> _pacienteRepoMock = new();
        private readonly Mock<IMedicoRepository> _medicoRepoMock = new();
        private readonly Mock<IUsuarioContexto> _usuarioContextoMock = new();
        private readonly GetAllConsultasUseCase _useCase;

        public GetAllConsultasUseCaseTests()
        {
            _useCase = new GetAllConsultasUseCase(
                _consultaRepoMock.Object,
                _pacienteRepoMock.Object,
                _medicoRepoMock.Object,
                _usuarioContextoMock.Object
            );
        }

        [Fact]
        public async Task Execute_MedicoLogado_RetornaApenasConsultasDoMedico()
        {
            var usuarioId = Guid.NewGuid();
            var medicoLogado = EntidadeFactory.CriarMedico(usuarioId: usuarioId);
            var outroMedico = EntidadeFactory.CriarMedico();
            var paciente = EntidadeFactory.CriarPaciente();

            var consultaDoMedico = EntidadeFactory.CriarConsulta(pacienteId: paciente.Id, medicoId: medicoLogado.Id);
            var consultaDeOutro = EntidadeFactory.CriarConsulta(pacienteId: paciente.Id, medicoId: outroMedico.Id);

            _usuarioContextoMock.Setup(c => c.Perfil).Returns("Medico");
            _usuarioContextoMock.Setup(c => c.UsuarioId).Returns(usuarioId);
            _medicoRepoMock.Setup(r => r.GetByUsuarioId(usuarioId)).ReturnsAsync(medicoLogado);
            _consultaRepoMock.Setup(r => r.GetAll()).ReturnsAsync([consultaDoMedico, consultaDeOutro]);
            _pacienteRepoMock.Setup(r => r.GetAll()).ReturnsAsync([paciente]);
            _medicoRepoMock.Setup(r => r.GetAll()).ReturnsAsync([medicoLogado, outroMedico]);

            var resultado = await _useCase.Execute();

            resultado.Should().HaveCount(1);
            resultado[0].Id.Should().Be(consultaDoMedico.Id);
            resultado[0].MedicoId.Should().Be(medicoLogado.Id);
            resultado[0].NomePaciente.Should().Be(paciente.Nome);
            resultado[0].NomeMedico.Should().Be(medicoLogado.Nome);
        }

        [Fact]
        public async Task Execute_MedicoSemRegistroVinculado_RetornaListaVazia()
        {
            var usuarioId = Guid.NewGuid();
            var consulta = EntidadeFactory.CriarConsulta();

            _usuarioContextoMock.Setup(c => c.Perfil).Returns("Medico");
            _usuarioContextoMock.Setup(c => c.UsuarioId).Returns(usuarioId);
            _medicoRepoMock.Setup(r => r.GetByUsuarioId(usuarioId)).ReturnsAsync((Medico?)null);
            _consultaRepoMock.Setup(r => r.GetAll()).ReturnsAsync([consulta]);

            var resultado = await _useCase.Execute();

            resultado.Should().BeEmpty();
            _pacienteRepoMock.Verify(r => r.GetAll(), Times.Never);
        }

        [Fact]
        public async Task Execute_Recepcionista_RetornaTodasAsConsultas()
        {
            var medico1 = EntidadeFactory.CriarMedico();
            var medico2 = EntidadeFactory.CriarMedico();
            var paciente = EntidadeFactory.CriarPaciente();

            var consulta1 = EntidadeFactory.CriarConsulta(pacienteId: paciente.Id, medicoId: medico1.Id);
            var consulta2 = EntidadeFactory.CriarConsulta(pacienteId: paciente.Id, medicoId: medico2.Id);

            _usuarioContextoMock.Setup(c => c.Perfil).Returns("Recepcionista");
            _consultaRepoMock.Setup(r => r.GetAll()).ReturnsAsync([consulta1, consulta2]);
            _pacienteRepoMock.Setup(r => r.GetAll()).ReturnsAsync([paciente]);
            _medicoRepoMock.Setup(r => r.GetAll()).ReturnsAsync([medico1, medico2]);

            var resultado = await _useCase.Execute();

            resultado.Should().HaveCount(2);
            _medicoRepoMock.Verify(r => r.GetByUsuarioId(It.IsAny<Guid>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Enfermeiro_RetornaTodasAsConsultas()
        {
            var medico1 = EntidadeFactory.CriarMedico();
            var medico2 = EntidadeFactory.CriarMedico();
            var paciente = EntidadeFactory.CriarPaciente();

            var consulta1 = EntidadeFactory.CriarConsulta(pacienteId: paciente.Id, medicoId: medico1.Id);
            var consulta2 = EntidadeFactory.CriarConsulta(pacienteId: paciente.Id, medicoId: medico2.Id);

            _usuarioContextoMock.Setup(c => c.Perfil).Returns("Enfermeiro");
            _consultaRepoMock.Setup(r => r.GetAll()).ReturnsAsync([consulta1, consulta2]);
            _pacienteRepoMock.Setup(r => r.GetAll()).ReturnsAsync([paciente]);
            _medicoRepoMock.Setup(r => r.GetAll()).ReturnsAsync([medico1, medico2]);

            var resultado = await _useCase.Execute();

            resultado.Should().HaveCount(2);
            _medicoRepoMock.Verify(r => r.GetByUsuarioId(It.IsAny<Guid>()), Times.Never);
        }
    }
}