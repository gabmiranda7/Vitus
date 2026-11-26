using System.Text.RegularExpressions;
using FluentAssertions;
using Moq;
using Vitus.Application.UseCases.Auth.RedefinirSenhaUsuario;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Tests.UseCases.Auth
{
    public class RedefinirSenhaUsuarioUseCaseTests
    {
        private readonly Mock<IUsuarioRepository> _usuarioRepoMock = new();
        private readonly Mock<IAuditoriaService> _auditoriaMock = new();
        private readonly RedefinirSenhaUsuarioUseCase _useCase;

        public RedefinirSenhaUsuarioUseCaseTests()
        {
            _useCase = new RedefinirSenhaUsuarioUseCase(_usuarioRepoMock.Object, _auditoriaMock.Object);
        }

        private static Usuario Aprovado()
        {
            var usuario = new Usuario("Maria", "maria@vitus.com",
                BCrypt.Net.BCrypt.HashPassword("SenhaAntiga@1"), PerfilUsuario.Recepcionista);
            usuario.Aprovar();
            return usuario;
        }

        [Fact]
        public async Task Execute_Success()
        {
            var usuario = Aprovado();
            _usuarioRepoMock.Setup(r => r.GetById(usuario.Id)).ReturnsAsync(usuario);

            var resposta = await _useCase.Execute(usuario.Id);

            usuario.DeveTrocarSenha.Should().BeTrue();
            BCrypt.Net.BCrypt.Verify(resposta.SenhaTemporaria, usuario.SenhaHash).Should().BeTrue();
            BCrypt.Net.BCrypt.Verify("SenhaAntiga@1", usuario.SenhaHash).Should().BeFalse();
            _usuarioRepoMock.Verify(r => r.Update(usuario), Times.Once);
            _auditoriaMock.Verify(a => a.Registrar(
                AcaoAuditoria.RedefinicaoSenhaPeloAdmin, "Usuario", usuario.Id,
                It.Is<string?>(d => d != null && !d.Contains(resposta.SenhaTemporaria))), Times.Once);
        }

        [Fact]
        public async Task Execute_Success_LimpaPedidoDeRedefinicao()
        {
            var usuario = Aprovado();
            usuario.SolicitarRedefinicaoSenha();
            _usuarioRepoMock.Setup(r => r.GetById(usuario.Id)).ReturnsAsync(usuario);

            await _useCase.Execute(usuario.Id);

            usuario.RedefinicaoSolicitadaEm.Should().BeNull();
        }

        [Fact]
        public async Task Execute_Fail_UsuarioNaoEncontrado()
        {
            _usuarioRepoMock.Setup(r => r.GetById(It.IsAny<Guid>())).ReturnsAsync((Usuario?)null);

            var act = () => _useCase.Execute(Guid.NewGuid());

            await act.Should().ThrowAsync<DomainException>().WithMessage("Usuário não encontrado");
            _usuarioRepoMock.Verify(r => r.Update(It.IsAny<Usuario>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Fail_UsuarioInativo()
        {
            var usuario = Aprovado();
            usuario.Desativar();
            _usuarioRepoMock.Setup(r => r.GetById(usuario.Id)).ReturnsAsync(usuario);

            var act = () => _useCase.Execute(usuario.Id);

            await act.Should().ThrowAsync<DomainException>();
            _usuarioRepoMock.Verify(r => r.Update(It.IsAny<Usuario>()), Times.Never);
        }

        [Fact]
        public void GerarSenhaTemporaria_AtendeRegrasDeSenhaForte()
        {
            for (var i = 0; i < 200; i++)
            {
                var senha = RedefinirSenhaUsuarioUseCase.GerarSenhaTemporaria();

                senha.Should().HaveLength(12);
                Regex.IsMatch(senha, "[A-Z]").Should().BeTrue();
                Regex.IsMatch(senha, "[a-z]").Should().BeTrue();
                Regex.IsMatch(senha, "[0-9]").Should().BeTrue();
                Regex.IsMatch(senha, "[^a-zA-Z0-9]").Should().BeTrue();
            }
        }
    }
}