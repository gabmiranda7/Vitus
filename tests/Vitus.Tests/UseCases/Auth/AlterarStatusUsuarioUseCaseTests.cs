using FluentAssertions;
using Moq;
using Vitus.Application.UseCases.Auth.AlterarStatusUsuario;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Tests.UseCases.Auth
{
    public class AlterarStatusUsuarioUseCaseTests
    {
        private readonly Mock<IUsuarioRepository> _usuarioRepoMock = new();
        private readonly Mock<IAuditoriaService> _auditoriaMock = new();
        private readonly AlterarStatusUsuarioUseCase _useCase;

        public AlterarStatusUsuarioUseCaseTests()
        {
            _useCase = new AlterarStatusUsuarioUseCase(_usuarioRepoMock.Object, _auditoriaMock.Object);
        }

        private static Usuario Aprovado()
        {
            var usuario = new Usuario("Maria", "maria@vitus.com", "hash", PerfilUsuario.Recepcionista);
            usuario.Aprovar();
            return usuario;
        }

        [Fact]
        public async Task Desativar_Success()
        {
            var usuario = Aprovado();
            _usuarioRepoMock.Setup(r => r.GetById(usuario.Id)).ReturnsAsync(usuario);

            await _useCase.Execute(usuario.Id, ativar: false);

            usuario.Status.Should().Be(StatusUsuario.Inativo);
            _usuarioRepoMock.Verify(r => r.Update(usuario), Times.Once);
            _auditoriaMock.Verify(a => a.Registrar(
                AcaoAuditoria.AtualizacaoPerfil, "Usuario", usuario.Id, It.IsAny<string?>()), Times.Once);
        }

        [Fact]
        public async Task Reativar_Success()
        {
            var usuario = Aprovado();
            usuario.Desativar();
            _usuarioRepoMock.Setup(r => r.GetById(usuario.Id)).ReturnsAsync(usuario);

            await _useCase.Execute(usuario.Id, ativar: true);

            usuario.Status.Should().Be(StatusUsuario.Aprovado);
            _usuarioRepoMock.Verify(r => r.Update(usuario), Times.Once);
        }

        [Fact]
        public async Task Desativar_Fail_Administrador()
        {
            var admin = new Usuario("Admin", "admin@vitus.com", "hash", PerfilUsuario.Administrador);
            _usuarioRepoMock.Setup(r => r.GetById(admin.Id)).ReturnsAsync(admin);

            var act = async () => await _useCase.Execute(admin.Id, ativar: false);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Não é possível desativar uma conta de Administrador");
            _usuarioRepoMock.Verify(r => r.Update(It.IsAny<Usuario>()), Times.Never);
        }

        [Fact]
        public async Task Desativar_Fail_CadastroPendente()
        {
            var pendente = new Usuario("Maria", "maria@vitus.com", "hash", PerfilUsuario.Recepcionista);
            _usuarioRepoMock.Setup(r => r.GetById(pendente.Id)).ReturnsAsync(pendente);

            var act = async () => await _useCase.Execute(pendente.Id, ativar: false);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Apenas usuários ativos podem ser desativados");
        }

        [Fact]
        public async Task Reativar_Fail_UsuarioAtivo()
        {
            var usuario = Aprovado();
            _usuarioRepoMock.Setup(r => r.GetById(usuario.Id)).ReturnsAsync(usuario);

            var act = async () => await _useCase.Execute(usuario.Id, ativar: true);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Apenas usuários inativos podem ser reativados");
        }

        [Fact]
        public async Task Execute_Fail_UsuarioNaoEncontrado()
        {
            _usuarioRepoMock.Setup(r => r.GetById(It.IsAny<Guid>())).ReturnsAsync((Usuario?)null);

            var act = async () => await _useCase.Execute(Guid.NewGuid(), ativar: false);

            await act.Should().ThrowAsync<DomainException>().WithMessage("Usuário não encontrado");
        }
    }
}