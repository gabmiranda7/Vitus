using Moq;
using FluentAssertions;
using Vitus.Application.UseCases.Pacientes.DeletePaciente;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;
using Vitus.Tests.Helpers;

namespace Vitus.Tests.UseCases.Pacientes
{
    public class DeletePacienteUseCaseTests
    {
        private readonly Mock<IPacienteRepository> _repositoryMock;
        private readonly Mock<IAuditoriaService> _auditoriaServiceMock;
        private readonly Mock<IExameRepository> _exameRepoMock;
        private readonly Mock<IArquivoService> _arquivoMock;
        private readonly DeletePacienteUseCase _useCase;

        public DeletePacienteUseCaseTests()
        {
            _repositoryMock = new Mock<IPacienteRepository>();
            _auditoriaServiceMock = new Mock<IAuditoriaService>();
            _exameRepoMock = new Mock<IExameRepository>();
            _arquivoMock = new Mock<IArquivoService>();
            _useCase = new DeletePacienteUseCase(
                _repositoryMock.Object,
                _auditoriaServiceMock.Object,
                _exameRepoMock.Object,
                _arquivoMock.Object);
        }

        private static Exame ExameComArquivos(Guid prontuarioId)
        {
            var exame = new Exame(prontuarioId, null, CategoriaExame.Sangue, "Hemograma", null,
                "Dr. Carlos", new DateOnly(2026, 11, 1), null);
            exame.AnexarArquivo("/app/storage/exames/a.pdf", "a.pdf");
            exame.AnexarArquivo("/app/storage/exames/b.png", "b.png");
            return exame;
        }

        [Fact]
        public async Task Execute_Success()
        {
            var pacienteId = Guid.NewGuid();
            var paciente = EntidadeFactory.CriarPaciente();

            _repositoryMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync(paciente);
            _exameRepoMock.Setup(r => r.GetByProntuarioId(paciente.Prontuario.Id))
                .ReturnsAsync(new List<Exame>());

            var act = async () => await _useCase.Execute(pacienteId);

            await act.Should().NotThrowAsync();
            _repositoryMock.Verify(r => r.Delete(paciente), Times.Once);
        }

        [Fact]
        public async Task Execute_Success_ApagaArquivosDeExameDoDisco_SemRepetir()
        {
            var pacienteId = Guid.NewGuid();
            var paciente = EntidadeFactory.CriarPaciente();
            var exame = ExameComArquivos(paciente.Prontuario.Id);

            _repositoryMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync(paciente);
            _exameRepoMock.Setup(r => r.GetByProntuarioId(paciente.Prontuario.Id))
                .ReturnsAsync(new List<Exame> { exame });

            await _useCase.Execute(pacienteId);

            // a.pdf está no legado (CaminhoArquivo) e na lista de arquivos: deve ser apagado uma vez só
            _arquivoMock.Verify(a => a.Deletar("/app/storage/exames/a.pdf"), Times.Once);
            _arquivoMock.Verify(a => a.Deletar("/app/storage/exames/b.png"), Times.Once);
        }

        [Fact]
        public async Task Execute_Fail_FalhaNoBanco_NaoApagaArquivos()
        {
            var pacienteId = Guid.NewGuid();
            var paciente = EntidadeFactory.CriarPaciente();
            var exame = ExameComArquivos(paciente.Prontuario.Id);

            _repositoryMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync(paciente);
            _repositoryMock.Setup(r => r.Delete(paciente)).ThrowsAsync(new InvalidOperationException());
            _exameRepoMock.Setup(r => r.GetByProntuarioId(paciente.Prontuario.Id))
                .ReturnsAsync(new List<Exame> { exame });

            var act = async () => await _useCase.Execute(pacienteId);

            await act.Should().ThrowAsync<InvalidOperationException>();
            _arquivoMock.Verify(a => a.Deletar(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Fail_PacienteNotFound()
        {
            var pacienteId = Guid.NewGuid();

            _repositoryMock.Setup(r => r.GetById(pacienteId)).ReturnsAsync((Paciente?)null);

            var act = async () => await _useCase.Execute(pacienteId);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Paciente não encontrado.");
        }
    }
}