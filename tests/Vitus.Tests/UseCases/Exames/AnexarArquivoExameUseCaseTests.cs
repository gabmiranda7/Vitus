using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;
using Vitus.Application.UseCases.Exames.AnexarArquivo;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;
using Vitus.Tests.Helpers;

namespace Vitus.Tests.UseCases.Exames
{
    public class AnexarArquivoExameUseCaseTests
    {
        private static readonly byte[] CabecalhoPng = { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00 };

        private readonly Mock<IExameRepository> _exameRepoMock = new();
        private readonly Mock<IArquivoService> _arquivoMock = new();
        private readonly Mock<IAuditoriaService> _auditoriaMock = new();
        private readonly Mock<IConsultaRepository> _consultaRepoMock = new();
        private readonly Mock<IConsultaAcessoService> _acessoMock = new();
        private readonly AnexarArquivoExameUseCase _useCase;

        public AnexarArquivoExameUseCaseTests()
        {
            _useCase = new AnexarArquivoExameUseCase(
                _exameRepoMock.Object,
                _arquivoMock.Object,
                _auditoriaMock.Object,
                _consultaRepoMock.Object,
                _acessoMock.Object);
        }

        private static Exame NovoExame(Guid? consultaId) =>
            new(Guid.NewGuid(), consultaId, CategoriaExame.Sangue, "Hemograma", null,
                "Dr. Carlos", new DateOnly(2026, 11, 1), null);

        private static IFormFile ArquivoPng()
        {
            var mock = new Mock<IFormFile>();
            mock.Setup(f => f.FileName).Returns("exame.png");
            mock.Setup(f => f.Length).Returns(CabecalhoPng.Length);
            mock.Setup(f => f.OpenReadStream()).Returns(() => new MemoryStream(CabecalhoPng));
            return mock.Object;
        }

        [Fact]
        public async Task Execute_Fail_ConsultaDeOutroMedico_NaoSalvaArquivo()
        {
            var consulta = EntidadeFactory.CriarConsulta();
            var exame = NovoExame(consulta.Id);

            _exameRepoMock.Setup(r => r.GetById(exame.Id)).ReturnsAsync(exame);
            _consultaRepoMock.Setup(r => r.GetById(consulta.Id)).ReturnsAsync(consulta);
            _acessoMock.Setup(a => a.GarantirMedicoResponsavel(consulta))
                .ThrowsAsync(new AcessoNegadoException("Você só pode realizar esta ação em consultas atribuídas a você"));

            var act = async () => await _useCase.Execute(exame.Id, new List<IFormFile> { ArquivoPng() });

            await act.Should().ThrowAsync<AcessoNegadoException>();
            _arquivoMock.Verify(a => a.Salvar(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
            _exameRepoMock.Verify(r => r.Update(It.IsAny<Exame>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Success_ExameSemConsulta_NaoConferePermissao()
        {
            var exame = NovoExame(null);

            _exameRepoMock.Setup(r => r.GetById(exame.Id)).ReturnsAsync(exame);
            _arquivoMock.Setup(a => a.Salvar(It.IsAny<Stream>(), It.IsAny<string>(), "exames"))
                .ReturnsAsync("/app/storage/exames/novo.png");

            await _useCase.Execute(exame.Id, new List<IFormFile> { ArquivoPng() });

            _acessoMock.Verify(a => a.GarantirMedicoResponsavel(It.IsAny<Consulta>()), Times.Never);
            _exameRepoMock.Verify(r => r.Update(exame), Times.Once);
        }
    }
}