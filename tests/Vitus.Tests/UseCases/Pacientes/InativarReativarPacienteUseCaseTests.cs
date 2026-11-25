using FluentAssertions;
using Moq;
using Vitus.Application.UseCases.Pacientes.InativarPaciente;
using Vitus.Application.UseCases.Pacientes.ReativarPaciente;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;
using Vitus.Tests.Helpers;

namespace Vitus.Tests.UseCases.Pacientes
{
    public class InativarReativarPacienteUseCaseTests
    {
        private readonly Mock<IPacienteRepository> _repositoryMock = new();
        private readonly Mock<IConsultaRepository> _consultaRepoMock = new();
        private readonly Mock<IAuditoriaService> _auditoriaMock = new();

        private InativarPacienteUseCase Inativar() =>
            new(_repositoryMock.Object, _consultaRepoMock.Object, _auditoriaMock.Object);

        private ReativarPacienteUseCase Reativar() =>
            new(_repositoryMock.Object, _auditoriaMock.Object);

        [Fact]
        public async Task Inativar_Success_MarcaInativoEAudita()
        {
            var paciente = EntidadeFactory.CriarPaciente();
            _repositoryMock.Setup(r => r.GetById(paciente.Id)).ReturnsAsync(paciente);

            await Inativar().Execute(paciente.Id);

            paciente.Ativo.Should().BeFalse();
            _repositoryMock.Verify(r => r.Update(paciente), Times.Once);
            _auditoriaMock.Verify(a => a.Registrar(
                AcaoAuditoria.InativacaoPaciente, "Paciente", paciente.Id, It.IsAny<string?>()), Times.Once);
        }

        [Fact]
        public async Task Inativar_Fail_ConsultaEmAndamento()
        {
            var paciente = EntidadeFactory.CriarPaciente();
            _repositoryMock.Setup(r => r.GetById(paciente.Id)).ReturnsAsync(paciente);
            _consultaRepoMock.Setup(r => r.ExisteEmAndamentoDoPaciente(paciente.Id)).ReturnsAsync(true);

            var act = async () => await Inativar().Execute(paciente.Id);

            await act.Should().ThrowAsync<DomainException>().WithMessage("*consultas em andamento*");
            paciente.Ativo.Should().BeTrue();
            _repositoryMock.Verify(r => r.Update(It.IsAny<Paciente>()), Times.Never);
        }

        [Fact]
        public async Task Inativar_Fail_PacienteNaoEncontrado()
        {
            _repositoryMock.Setup(r => r.GetById(It.IsAny<Guid>())).ReturnsAsync((Paciente?)null);

            var act = async () => await Inativar().Execute(Guid.NewGuid());

            await act.Should().ThrowAsync<DomainException>().WithMessage("Paciente não encontrado.");
        }

        [Fact]
        public async Task Inativar_Fail_JaInativo()
        {
            var paciente = EntidadeFactory.CriarPaciente();
            paciente.Inativar();
            _repositoryMock.Setup(r => r.GetById(paciente.Id)).ReturnsAsync(paciente);

            var act = async () => await Inativar().Execute(paciente.Id);

            await act.Should().ThrowAsync<DomainException>().WithMessage("Paciente já está inativo");
        }

        [Fact]
        public async Task Reativar_Success_MarcaAtivoEAudita()
        {
            var paciente = EntidadeFactory.CriarPaciente();
            paciente.Inativar();
            _repositoryMock.Setup(r => r.GetById(paciente.Id)).ReturnsAsync(paciente);

            await Reativar().Execute(paciente.Id);

            paciente.Ativo.Should().BeTrue();
            _repositoryMock.Verify(r => r.Update(paciente), Times.Once);
            _auditoriaMock.Verify(a => a.Registrar(
                AcaoAuditoria.ReativacaoPaciente, "Paciente", paciente.Id, It.IsAny<string?>()), Times.Once);
        }

        [Fact]
        public async Task Reativar_Fail_JaAtivo()
        {
            var paciente = EntidadeFactory.CriarPaciente();
            _repositoryMock.Setup(r => r.GetById(paciente.Id)).ReturnsAsync(paciente);

            var act = async () => await Reativar().Execute(paciente.Id);

            await act.Should().ThrowAsync<DomainException>().WithMessage("Paciente já está ativo");
        }

        [Fact]
        public void Atualizar_Fail_PacienteInativo()
        {
            var paciente = EntidadeFactory.CriarPaciente();
            paciente.Inativar();

            var act = () => paciente.Atualizar("Novo Nome", null, null, null, null, null, null, null, null, null, null);

            act.Should().Throw<DomainException>().WithMessage("*inativo*");
        }
    }
}