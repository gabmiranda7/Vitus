using FluentAssertions;
using Moq;
using Vitus.Application.UseCases.Auth.TrocarSenha;
using Vitus.Communication.Auth.Requests;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Tests.UseCases.Auth
{
    public class TrocarSenhaUseCaseTests
    {
        private const string SenhaTemporaria = "Temp#Senha42";

        private readonly Mock<IUsuarioRepository> _usuarioRepoMock = new();
        private readonly Mock<IMedicoRepository> _medicoRepoMock = new();
        private readonly Mock<ITokenService> _tokenMock = new();
        private readonly Mock<IAuditoriaService> _auditoriaMock = new();
        private readonly TrocarSenhaUseCase _useCase;

        public TrocarSenhaUseCaseTests()
        {
            _tokenMock.Setup(t => t.Generate(It.IsAny<Usuario>())).Returns("novo-token");
            _useCase = new TrocarSenhaUseCase(
                _usuarioRepoMock.Object, _medicoRepoMock.Object, _tokenMock.Object, _auditoriaMock.Object);
        }

        private static Usuario ComSenhaTemporaria()
        {
            var usuario = new Usuario("Maria", "maria@vitus.com",
                BCrypt.Net.BCrypt.HashPassword("Antiga@123"), PerfilUsuario.Recepcionista);
            usuario.Aprovar();
            usuario.RedefinirComSenhaTemporaria(BCrypt.Net.BCrypt.HashPassword(SenhaTemporaria));
            return usuario;
        }

        [Fact]
        public async Task Execute_Success()
        {
            var usuario = ComSenhaTemporaria();
            _usuarioRepoMock.Setup(r => r.GetById(usuario.Id)).ReturnsAsync(usuario);

            var resposta = await _useCase.Execute(usuario.Id,
                new TrocarSenhaRequestJson { SenhaAtual = SenhaTemporaria, NovaSenha = "Nova@Senha9" });

            usuario.DeveTrocarSenha.Should().BeFalse();
            BCrypt.Net.BCrypt.Verify("Nova@Senha9", usuario.SenhaHash).Should().BeTrue();
            resposta.Token.Should().Be("novo-token");
            resposta.DeveTrocarSenha.Should().BeFalse();
            _usuarioRepoMock.Verify(r => r.Update(usuario), Times.Once);
            _auditoriaMock.Verify(a => a.Registrar(
                AcaoAuditoria.TrocaDeSenha, "Usuario", usuario.Id, It.IsAny<string?>()), Times.Once);
        }

        [Fact]
        public async Task Execute_Fail_SenhaAtualIncorreta()
        {
            var usuario = ComSenhaTemporaria();
            _usuarioRepoMock.Setup(r => r.GetById(usuario.Id)).ReturnsAsync(usuario);

            var act = () => _useCase.Execute(usuario.Id,
                new TrocarSenhaRequestJson { SenhaAtual = "Errada@123", NovaSenha = "Nova@Senha9" });

            await act.Should().ThrowAsync<DomainException>().WithMessage("Senha atual incorreta");
            usuario.DeveTrocarSenha.Should().BeTrue();
            _usuarioRepoMock.Verify(r => r.Update(It.IsAny<Usuario>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Fail_UsuarioNaoEncontrado()
        {
            _usuarioRepoMock.Setup(r => r.GetById(It.IsAny<Guid>())).ReturnsAsync((Usuario?)null);

            var act = () => _useCase.Execute(Guid.NewGuid(),
                new TrocarSenhaRequestJson { SenhaAtual = SenhaTemporaria, NovaSenha = "Nova@Senha9" });

            await act.Should().ThrowAsync<DomainException>().WithMessage("Usuário não encontrado");
        }
    }
}