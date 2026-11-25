using Moq;
using FluentAssertions;
using Vitus.Application.UseCases.Consultas.CreateConsulta;
using Vitus.Communication.Consulta.Requests;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;
using Vitus.Tests.Helpers;

namespace Vitus.Tests.UseCases.Consultas
{
    public class CreateConsultaUseCaseTests
    {
        private readonly Mock<IConsultaRepository> _consultaRepoMock;
        private readonly Mock<IMedicoRepository> _medicoRepoMock;
        private readonly Mock<IPacienteRepository> _pacienteRepoMock;
        private readonly Mock<IAuditoriaService> _auditoriaServiceMock;
        private readonly Mock<IUsuarioRepository> _usuarioRepoMock;
        private readonly CreateConsultaUseCase _useCase;

        public CreateConsultaUseCaseTests()
        {
            _consultaRepoMock = new Mock<IConsultaRepository>();
            _medicoRepoMock = new Mock<IMedicoRepository>();
            _pacienteRepoMock = new Mock<IPacienteRepository>();
            _auditoriaServiceMock = new Mock<IAuditoriaService>();
            _usuarioRepoMock = new Mock<IUsuarioRepository>();
            _useCase = new CreateConsultaUseCase(
                _consultaRepoMock.Object,
                _medicoRepoMock.Object,
                _pacienteRepoMock.Object,
                _auditoriaServiceMock.Object,
                _usuarioRepoMock.Object
            );
        }

        private void ConfigurarUsuarioDoMedico(Medico medico, bool aprovado)
        {
            var usuario = new Usuario("Médico", "medico@vitus.com", "hash", PerfilUsuario.Medico);
            if (aprovado)
                usuario.Aprovar();

            _usuarioRepoMock.Setup(r => r.GetById(medico.UsuarioId)).ReturnsAsync(usuario);
        }

        [Fact]
        public async Task Execute_Success()
        {
            var pacienteId = Guid.NewGuid();
            var medicoId = Guid.NewGuid();
            var paciente = EntidadeFactory.CriarPaciente();
            var medico = EntidadeFactory.CriarMedico();

            _pacienteRepoMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync(paciente);
            _medicoRepoMock.Setup(r => r.GetById(medicoId)).ReturnsAsync(medico);
            ConfigurarUsuarioDoMedico(medico, aprovado: true);

            var request = new CreateConsultaRequestJson
            {
                PacienteId = pacienteId,
                MedicoId = medicoId,
                DataConsulta = DateTime.UtcNow.AddHours(2)
            };

            var resultado = await _useCase.Execute(request);

            resultado.Should().NotBeNull();
            resultado.PacienteId.Should().Be(pacienteId);
            resultado.NomePaciente.Should().Be(paciente.Nome);
            resultado.NomeMedico.Should().Be(medico.Nome);
            resultado.Status.Should().Be("Agendada");
            _consultaRepoMock.Verify(r => r.Add(It.IsAny<Consulta>()), Times.Once);
        }

        [Fact]
        public async Task Execute_Fail_PacienteNotFound()
        {
            var pacienteId = Guid.NewGuid();
            var medicoId = Guid.NewGuid();

            _pacienteRepoMock.Setup(r => r.GetById(pacienteId))
                .ReturnsAsync((Paciente?)null);

            var request = new CreateConsultaRequestJson
            {
                PacienteId = pacienteId,
                MedicoId = medicoId,
                DataConsulta = DateTime.UtcNow.AddHours(2)
            };

            var act = async () => await _useCase.Execute(request);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Paciente não encontrado");
        }

        [Fact]
        public async Task Execute_Fail_MedicoNotFound()
        {
            var pacienteId = Guid.NewGuid();
            var medicoId = Guid.NewGuid();
            var paciente = EntidadeFactory.CriarPaciente();

            _pacienteRepoMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync(paciente);
            _medicoRepoMock.Setup(r => r.GetById(medicoId))
                .ReturnsAsync((Medico?)null);

            var request = new CreateConsultaRequestJson
            {
                PacienteId = pacienteId,
                MedicoId = medicoId,
                DataConsulta = DateTime.UtcNow.AddHours(2)
            };

            var act = async () => await _useCase.Execute(request);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Médico não encontrado");
        }

        [Fact]
        public async Task Execute_Fail_MedicoSemContaAprovada()
        {
            var pacienteId = Guid.NewGuid();
            var medicoId = Guid.NewGuid();
            var paciente = EntidadeFactory.CriarPaciente();
            var medico = EntidadeFactory.CriarMedico();

            _pacienteRepoMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync(paciente);
            _medicoRepoMock.Setup(r => r.GetById(medicoId)).ReturnsAsync(medico);
            ConfigurarUsuarioDoMedico(medico, aprovado: false);

            var request = new CreateConsultaRequestJson
            {
                PacienteId = pacienteId,
                MedicoId = medicoId,
                DataConsulta = DateTime.UtcNow.AddHours(2)
            };

            var act = async () => await _useCase.Execute(request);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Médico indisponível para atendimentos");
            _consultaRepoMock.Verify(r => r.Add(It.IsAny<Consulta>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Fail_PacienteInativo()
        {
            var pacienteId = Guid.NewGuid();
            var medicoId = Guid.NewGuid();
            var paciente = EntidadeFactory.CriarPaciente();
            paciente.Inativar();

            _pacienteRepoMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync(paciente);

            var request = new CreateConsultaRequestJson
            {
                PacienteId = pacienteId,
                MedicoId = medicoId,
                DataConsulta = DateTime.UtcNow.AddHours(2)
            };

            var act = async () => await _useCase.Execute(request);

            await act.Should().ThrowAsync<DomainException>().WithMessage("Paciente inativo*");
            _consultaRepoMock.Verify(r => r.Add(It.IsAny<Consulta>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Fail_DataNoPassado()
        {
            var pacienteId = Guid.NewGuid();
            var medicoId = Guid.NewGuid();
            var paciente = EntidadeFactory.CriarPaciente();
            var medico = EntidadeFactory.CriarMedico();

            _pacienteRepoMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync(paciente);
            _medicoRepoMock.Setup(r => r.GetById(medicoId)).ReturnsAsync(medico);
            ConfigurarUsuarioDoMedico(medico, aprovado: true);

            var request = new CreateConsultaRequestJson
            {
                PacienteId = pacienteId,
                MedicoId = medicoId,
                DataConsulta = DateTime.UtcNow.AddHours(-5)
            };

            var act = async () => await _useCase.Execute(request);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Consulta não pode ser no passado");
        }
    }
}