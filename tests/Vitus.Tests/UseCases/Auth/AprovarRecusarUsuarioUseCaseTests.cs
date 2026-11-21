using FluentAssertions;
using Moq;
using Vitus.Application.UseCases.Auth.AprovarUsuario;
using Vitus.Application.UseCases.Auth.RecusarUsuario;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Tests.UseCases.Auth
{
    public class AprovarRecusarUsuarioUseCaseTests
    {
        private readonly Mock<IUsuarioRepository> _usuarioRepoMock = new();
        private readonly Mock<IAuditoriaService> _auditoriaMock = new();

        private static Usuario Pendente() =>
            new("Maria", "maria@vitus.com", "hash", PerfilUsuario.Recepcionista);

        [Fact]
        public async Task Aprovar_Success_MudaStatusEAudita()
        {
            var usuario = Pendente();
            _usuarioRepoMock.Setup(r => r.GetById(usuario.Id)).ReturnsAsync(usuario);
            var useCase = new AprovarUsuarioUseCase(_usuarioRepoMock.Object, _auditoriaMock.Object);

            await useCase.Execute(usuario.Id);

            usuario.Status.Should().Be(StatusUsuario.Aprovado);
            _usuarioRepoMock.Verify(r => r.Update(usuario), Times.Once);
            _auditoriaMock.Verify(a => a.Registrar(
                AcaoAuditoria.AprovacaoCadastro, "Usuario", usuario.Id, It.IsAny<string?>()), Times.Once);
        }

        [Fact]
        public async Task Aprovar_Fail_UsuarioNaoEncontrado()
        {
            _usuarioRepoMock.Setup(r => r.GetById(It.IsAny<Guid>())).ReturnsAsync((Usuario?)null);
            var useCase = new AprovarUsuarioUseCase(_usuarioRepoMock.Object, _auditoriaMock.Object);

            var act = async () => await useCase.Execute(Guid.NewGuid());

            await act.Should().ThrowAsync<DomainException>().WithMessage("Usuário não encontrado");
        }

        [Fact]
        public async Task Aprovar_Fail_CadastroJaAprovado()
        {
            var usuario = Pendente();
            usuario.Aprovar();
            _usuarioRepoMock.Setup(r => r.GetById(usuario.Id)).ReturnsAsync(usuario);
            var useCase = new AprovarUsuarioUseCase(_usuarioRepoMock.Object, _auditoriaMock.Object);

            var act = async () => await useCase.Execute(usuario.Id);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Apenas cadastros pendentes podem ser aprovados");
            _usuarioRepoMock.Verify(r => r.Update(It.IsAny<Usuario>()), Times.Never);
        }

        [Fact]
        public async Task Recusar_Success_MudaStatusEAudita()
        {
            var usuario = Pendente();
            _usuarioRepoMock.Setup(r => r.GetById(usuario.Id)).ReturnsAsync(usuario);
            var useCase = new RecusarUsuarioUseCase(_usuarioRepoMock.Object, _auditoriaMock.Object);

            await useCase.Execute(usuario.Id);

            usuario.Status.Should().Be(StatusUsuario.Recusado);
            _usuarioRepoMock.Verify(r => r.Update(usuario), Times.Once);
            _auditoriaMock.Verify(a => a.Registrar(
                AcaoAuditoria.RecusaCadastro, "Usuario", usuario.Id, It.IsAny<string?>()), Times.Once);
        }

        [Fact]
        public async Task Recusar_Fail_CadastroJaAprovado()
        {
            var usuario = Pendente();
            usuario.Aprovar();
            _usuarioRepoMock.Setup(r => r.GetById(usuario.Id)).ReturnsAsync(usuario);
            var useCase = new RecusarUsuarioUseCase(_usuarioRepoMock.Object, _auditoriaMock.Object);

            var act = async () => await useCase.Execute(usuario.Id);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Apenas cadastros pendentes podem ser recusados");
        }
    }
}