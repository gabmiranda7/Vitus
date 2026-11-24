using FluentAssertions;
using Moq;
using Vitus.Application.UseCases.Exames.AnalisarExameIa;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;
using Vitus.Tests.Helpers;

namespace Vitus.Tests.UseCases.Exames
{
    public class AnalisarExameIaUseCaseTests
    {
        private readonly Mock<IExameRepository> _exameRepoMock = new();
        private readonly Mock<IProntuarioRepository> _prontuarioRepoMock = new();
        private readonly Mock<IPacienteRepository> _pacienteRepoMock = new();
        private readonly Mock<IArquivoService> _arquivoMock = new();
        private readonly Mock<IExtratorTextoPdf> _extratorMock = new();
        private readonly Mock<IAnalisadorExameIaService> _analisadorMock = new();
        private readonly Mock<IAuditoriaService> _auditoriaMock = new();
        private readonly Mock<IConsultaRepository> _consultaRepoMock = new();
        private readonly Mock<IConsultaAcessoService> _acessoMock = new();
        private readonly AnalisarExameIaUseCase _useCase;
        private readonly Paciente _paciente = EntidadeFactory.CriarPaciente();

        private IReadOnlyList<DocumentoExameIaInput>? _documentosEnviados;
        private string? _contextoEnviado;

        public AnalisarExameIaUseCaseTests()
        {
            _prontuarioRepoMock.Setup(r => r.GetById(_paciente.Prontuario.Id)).ReturnsAsync(_paciente.Prontuario);
            _pacienteRepoMock.Setup(r => r.GetById(_paciente.Id)).ReturnsAsync(_paciente);
            _arquivoMock.Setup(a => a.Ler(It.IsAny<string>())).ReturnsAsync(new byte[] { 1, 2, 3 });
            _extratorMock.Setup(e => e.ExtrairTexto(It.IsAny<byte[]>()))
                .Returns("Paciente liberado para joao silva\nHemoglobina: 13,5 g/dL");

            _analisadorMock
                .Setup(a => a.AnalisarExamesAsync(
                    It.IsAny<IReadOnlyList<DocumentoExameIaInput>>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .Callback<IReadOnlyList<DocumentoExameIaInput>, string, CancellationToken>((docs, contexto, _) =>
                {
                    _documentosEnviados = docs;
                    _contextoEnviado = contexto;
                })
                .ReturnsAsync("{}");

            _useCase = new AnalisarExameIaUseCase(
                _exameRepoMock.Object, _prontuarioRepoMock.Object, _pacienteRepoMock.Object,
                _arquivoMock.Object, _extratorMock.Object, _analisadorMock.Object,
                _auditoriaMock.Object, _consultaRepoMock.Object, _acessoMock.Object);
        }

        private Exame ExameComArquivos(params string[] nomes)
        {
            var exame = new Exame(_paciente.Prontuario.Id, null, CategoriaExame.Sangue, "Hemograma", null,
                "Dr. Carlos", new DateOnly(2026, 11, 1), null);

            foreach (var nome in nomes)
                exame.AnexarArquivo($"/app/storage/exames/{nome}", nome);

            _exameRepoMock.Setup(r => r.GetById(exame.Id)).ReturnsAsync(exame);
            return exame;
        }

        [Fact]
        public async Task Execute_Success_EnviaSoTextoSemDadosPessoais()
        {
            var exame = ExameComArquivos("laudo.pdf");

            await _useCase.Execute(exame.Id);

            _documentosEnviados.Should().ContainSingle();
            _documentosEnviados![0].Texto.Should().NotContain("joao").And.Contain("Hemoglobina");
            exame.AnaliseIaJson.Should().Be("{}");
            _exameRepoMock.Verify(r => r.Update(exame), Times.Once);
        }

        [Fact]
        public async Task Execute_Fail_SoImagens_NaoChamaAIA()
        {
            var exame = ExameComArquivos("foto.png");

            var act = async () => await _useCase.Execute(exame.Id);

            await act.Should().ThrowAsync<DomainException>().WithMessage("*PDFs*");
            _analisadorMock.Verify(a => a.AnalisarExamesAsync(
                It.IsAny<IReadOnlyList<DocumentoExameIaInput>>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
            _extratorMock.Verify(e => e.ExtrairTexto(It.IsAny<byte[]>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Fail_PdfEscaneado_SemTexto()
        {
            var exame = ExameComArquivos("escaneado.pdf");
            _extratorMock.Setup(e => e.ExtrairTexto(It.IsAny<byte[]>())).Returns((string?)null);

            var act = async () => await _useCase.Execute(exame.Id);

            await act.Should().ThrowAsync<DomainException>().WithMessage("*PDFs*");
            _exameRepoMock.Verify(r => r.Update(It.IsAny<Exame>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Success_ArquivosMistos_AnalisaOsPdfsEAvisaDosIgnorados()
        {
            var exame = ExameComArquivos("laudo.pdf", "foto.png");

            await _useCase.Execute(exame.Id);

            _documentosEnviados.Should().ContainSingle();
            _contextoEnviado.Should().Contain("não foram incluídos");
        }
    }
}