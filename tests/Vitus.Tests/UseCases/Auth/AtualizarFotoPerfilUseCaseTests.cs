using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;
using Vitus.Application.UseCases.Auth.AtualizarFotoPerfil;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Tests.UseCases.Auth
{
    public class AtualizarFotoPerfilUseCaseTests
    {
        private static readonly byte[] CabecalhoPng = { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00 };

        private readonly Mock<IUsuarioRepository> _usuarioRepoMock = new();
        private readonly Mock<IArquivoService> _arquivoMock = new();
        private readonly Mock<IAuditoriaService> _auditoriaMock = new();
        private readonly AtualizarFotoPerfilUseCase _useCase;
        private readonly Usuario _usuario;

        public AtualizarFotoPerfilUseCaseTests()
        {
            _usuario = new Usuario("Maria", "maria@vitus.com", "hash", PerfilUsuario.Recepcionista);
            _usuarioRepoMock.Setup(r => r.GetById(_usuario.Id)).ReturnsAsync(_usuario);
            _arquivoMock.Setup(a => a.Salvar(It.IsAny<Stream>(), It.IsAny<string>(), "perfis"))
                .ReturnsAsync("/app/storage/perfis/nova.png");
            _useCase = new AtualizarFotoPerfilUseCase(
                _usuarioRepoMock.Object, _arquivoMock.Object, _auditoriaMock.Object);
        }

        private static IFormFile Arquivo(string nome, byte[] conteudo, long? tamanho = null)
        {
            var mock = new Mock<IFormFile>();
            mock.Setup(f => f.FileName).Returns(nome);
            mock.Setup(f => f.Length).Returns(tamanho ?? conteudo.Length);
            mock.Setup(f => f.OpenReadStream()).Returns(() => new MemoryStream(conteudo));
            return mock.Object;
        }

        [Fact]
        public async Task Execute_Success_SalvaNaPastaPerfisEGuardaOCaminho()
        {
            await _useCase.Execute(_usuario.Id, Arquivo("foto.png", CabecalhoPng));

            _usuario.FotoCaminho.Should().Be("/app/storage/perfis/nova.png");
            _usuarioRepoMock.Verify(r => r.Update(_usuario), Times.Once);
            _arquivoMock.Verify(a => a.Deletar(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Success_ApagaAFotoAntiga()
        {
            _usuario.DefinirFoto("/app/storage/perfis/antiga.png");

            await _useCase.Execute(_usuario.Id, Arquivo("foto.png", CabecalhoPng));

            _arquivoMock.Verify(a => a.Deletar("/app/storage/perfis/antiga.png"), Times.Once);
        }

        [Fact]
        public async Task Execute_Fail_FormatoInvalido()
        {
            var act = async () => await _useCase.Execute(_usuario.Id, Arquivo("foto.gif", CabecalhoPng));

            await act.Should().ThrowAsync<DomainException>().WithMessage("Formato inválido. Use JPG ou PNG");
        }

        [Fact]
        public async Task Execute_Fail_ImagemGrandeDemais()
        {
            var act = async () => await _useCase.Execute(
                _usuario.Id, Arquivo("foto.png", CabecalhoPng, tamanho: 3 * 1024 * 1024));

            await act.Should().ThrowAsync<DomainException>().WithMessage("Imagem muito grande. Tamanho máximo: 2MB");
        }

        [Fact]
        public async Task Execute_Fail_ConteudoNaoEImagem()
        {
            var texto = new byte[] { 0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04 };

            var act = async () => await _useCase.Execute(_usuario.Id, Arquivo("foto.png", texto));

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("O conteúdo do arquivo não corresponde ao formato declarado");
            _arquivoMock.Verify(a => a.Salvar(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }
    }
}