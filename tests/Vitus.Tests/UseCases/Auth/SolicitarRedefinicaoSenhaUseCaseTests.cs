using FluentAssertions;
using Moq;
using Vitus.Application.UseCases.Auth.SolicitarRedefinicaoSenha;
using Vitus.Communication.Auth.Requests;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Interfaces;

namespace Vitus.Tests.UseCases.Auth
{
    public class SolicitarRedefinicaoSenhaUseCaseTests
    {
        private readonly Mock<IUsuarioRepository> _usuarioRepoMock = new();
        private readonly Mock<IAuditoriaService> _auditoriaMock = new();
        private readonly SolicitarRedefinicaoSenhaUseCase _useCase;

        public SolicitarRedefinicaoSenhaUseCaseTests()
        {
            _useCase = new SolicitarRedefinicaoSenhaUseCase(_usuarioRepoMock.Object, _auditoriaMock.Object);
        }

        [Fact]
        public async Task Execute_Success_MarcaPedido()
        {
            var usuario = new Usuario("Maria", "maria@vitus.com", "hash", PerfilUsuario.Recepcionista);
            usuario.Aprovar();
            _usuarioRepoMock.Setup(r => r.GetByEmail("maria@vitus.com")).ReturnsAsync(usuario);

            await _useCase.Execute(new EsqueciSenhaRequestJson { Email = "  Maria@Vitus.com " });

            usuario.RedefinicaoSolicitadaEm.Should().NotBeNull();
            _usuarioRepoMock.Verify(r => r.Update(usuario), Times.Once);
            _auditoriaMock.Verify(a => a.RegistrarComo(
                usuario.Id, usuario.Nome, AcaoAuditoria.SolicitacaoRedefinicaoSenha,
                "Usuario", usuario.Id, It.IsAny<string?>()), Times.Once);
        }

        [Fact]
        public async Task Execute_EmailInexistente_NaoFazNadaENaoLancaErro()
        {
            _usuarioRepoMock.Setup(r => r.GetByEmail(It.IsAny<string>())).ReturnsAsync((Usuario?)null);

            var act = () => _useCase.Execute(new EsqueciSenhaRequestJson { Email = "ninguem@vitus.com" });

            await act.Should().NotThrowAsync();
            _usuarioRepoMock.Verify(r => r.Update(It.IsAny<Usuario>()), Times.Never);
        }

        [Fact]
        public async Task Execute_CadastroPendente_NaoFazNada()
        {
            var pendente = new Usuario("Joao", "joao@vitus.com", "hash", PerfilUsuario.Medico);
            _usuarioRepoMock.Setup(r => r.GetByEmail("joao@vitus.com")).ReturnsAsync(pendente);

            await _useCase.Execute(new EsqueciSenhaRequestJson { Email = "joao@vitus.com" });

            pendente.RedefinicaoSolicitadaEm.Should().BeNull();
            _usuarioRepoMock.Verify(r => r.Update(It.IsAny<Usuario>()), Times.Never);
        }
    }
}