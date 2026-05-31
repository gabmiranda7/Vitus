using Moq;
using FluentAssertions;
using Vitus.Application.UseCases.Auth.Login;
using Vitus.Communication.Auth.Requests;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Tests.UseCases.Auth
{
    public class LoginUsuarioUseCaseTests
    {
        private readonly Mock<IUsuarioRepository> _usuarioRepoMock;
        private readonly Mock<ITokenService> _tokenServiceMock;
        private readonly LoginUsuarioUseCase _useCase;

        public LoginUsuarioUseCaseTests()
        {
            _usuarioRepoMock = new Mock<IUsuarioRepository>();
            _tokenServiceMock = new Mock<ITokenService>();
            _useCase = new LoginUsuarioUseCase(
                _usuarioRepoMock.Object,
                _tokenServiceMock.Object
            );
        }

        private static Usuario CriarUsuario(string nome = "Carlos", string email = "carlos@email.com", PerfilUsuario perfil = PerfilUsuario.Medico)
        {
            var senhaHash = BCrypt.Net.BCrypt.HashPassword("senha123");
            return new Usuario(nome, email, senhaHash, perfil);
        }

        [Fact]
        public async Task Execute_Success()
        {
            var usuario = CriarUsuario();

            _usuarioRepoMock.Setup(r => r.GetByEmail("carlos@email.com")).ReturnsAsync(usuario);
            _tokenServiceMock.Setup(t => t.Generate(usuario)).Returns("token_jwt_valido");

            var request = new LoginRequestJson { Email = "carlos@email.com", Senha = "senha123" };

            var resultado = await _useCase.Execute(request);

            resultado.Should().NotBeNull();
            resultado.Token.Should().Be("token_jwt_valido");
            resultado.Nome.Should().Be("Carlos");
            resultado.Email.Should().Be("carlos@email.com");
            resultado.Perfil.Should().Be("Medico");
        }

        [Fact]
        public async Task Execute_Fail_EmailNaoCadastrado()
        {
            _usuarioRepoMock.Setup(r => r.GetByEmail(It.IsAny<string>()))
                .ReturnsAsync((Usuario?)null);

            var request = new LoginRequestJson { Email = "naoexiste@email.com", Senha = "senha123" };

            var act = async () => await _useCase.Execute(request);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Email ou senha inválidos");
        }

        [Fact]
        public async Task Execute_Fail_SenhaErrada()
        {
            var usuario = CriarUsuario();

            _usuarioRepoMock.Setup(r => r.GetByEmail("carlos@email.com")).ReturnsAsync(usuario);

            var request = new LoginRequestJson { Email = "carlos@email.com", Senha = "senha_errada" };

            var act = async () => await _useCase.Execute(request);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Email ou senha inválidos");
        }

        [Theory]
        [InlineData(PerfilUsuario.Medico, "Medico")]
        [InlineData(PerfilUsuario.Enfermeiro, "Enfermeiro")]
        [InlineData(PerfilUsuario.Recepcionista, "Recepcionista")]
        public async Task Execute_Success_TodosOsPerfis(PerfilUsuario perfil, string perfilEsperado)
        {
            var usuario = CriarUsuario(perfil: perfil);

            _usuarioRepoMock.Setup(r => r.GetByEmail(It.IsAny<string>())).ReturnsAsync(usuario);
            _tokenServiceMock.Setup(t => t.Generate(usuario)).Returns("token");

            var request = new LoginRequestJson { Email = "user@email.com", Senha = "senha123" };

            var resultado = await _useCase.Execute(request);

            resultado.Perfil.Should().Be(perfilEsperado);
        }
    }
}