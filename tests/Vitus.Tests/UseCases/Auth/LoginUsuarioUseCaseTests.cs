using FluentAssertions;
using Moq;
using Vitus.Application.UseCases.Auth.Login;
using Vitus.Communication.Auth.Requests;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;
using Vitus.Tests.Helpers;

namespace Vitus.Tests.UseCases.Auth
{
    public class LoginUsuarioUseCaseTests
    {
        private const string SenhaCorreta = "Senha@123";

        private readonly Mock<IUsuarioRepository> _usuarioRepoMock = new();
        private readonly Mock<IMedicoRepository> _medicoRepoMock = new();
        private readonly Mock<ITokenService> _tokenServiceMock = new();
        private readonly Mock<ILoginAttemptTracker> _trackerMock = new();
        private readonly LoginUsuarioUseCase _useCase;

        public LoginUsuarioUseCaseTests()
        {
            _tokenServiceMock.Setup(t => t.Generate(It.IsAny<Usuario>())).Returns("token-fake");
            _useCase = new LoginUsuarioUseCase(
                _usuarioRepoMock.Object,
                _medicoRepoMock.Object,
                _tokenServiceMock.Object,
                _trackerMock.Object);
        }

        private static Usuario UsuarioAprovado(PerfilUsuario perfil = PerfilUsuario.Recepcionista, string nome = "Maria")
        {
            var usuario = new Usuario(nome, "maria@vitus.com", BCrypt.Net.BCrypt.HashPassword(SenhaCorreta), perfil);
            if (perfil != PerfilUsuario.Administrador)
                usuario.Aprovar();
            return usuario;
        }

        private static LoginRequestJson Request(string email = "maria@vitus.com", string senha = SenhaCorreta) =>
            new() { Email = email, Senha = senha };

        [Fact]
        public async Task Execute_Success()
        {
            var usuario = UsuarioAprovado();
            _usuarioRepoMock.Setup(r => r.GetByEmail("maria@vitus.com")).ReturnsAsync(usuario);

            var resultado = await _useCase.Execute(Request());

            resultado.Token.Should().Be("token-fake");
            resultado.Email.Should().Be("maria@vitus.com");
            resultado.Perfil.Should().Be("Recepcionista");
        }

        [Fact]
        public async Task Execute_Success_Administrador_JaNasceAprovado()
        {
            var admin = UsuarioAprovado(PerfilUsuario.Administrador, "Admin");
            _usuarioRepoMock.Setup(r => r.GetByEmail("maria@vitus.com")).ReturnsAsync(admin);

            var resultado = await _useCase.Execute(Request());

            resultado.Perfil.Should().Be("Administrador");
        }

        [Fact]
        public async Task Execute_Success_NormalizaEmailAntesDeBuscar()
        {
            var usuario = UsuarioAprovado();
            _usuarioRepoMock.Setup(r => r.GetByEmail("maria@vitus.com")).ReturnsAsync(usuario);

            await _useCase.Execute(Request("  MARIA@Vitus.COM "));

            _usuarioRepoMock.Verify(r => r.GetByEmail("maria@vitus.com"), Times.Once);
        }

        [Fact]
        public async Task Execute_Success_Medico_RetornaMedicoId()
        {
            var usuario = UsuarioAprovado(PerfilUsuario.Medico, "Dr. Carlos");
            var medico = EntidadeFactory.CriarMedico("Dr. Carlos");

            _usuarioRepoMock.Setup(r => r.GetByEmail("maria@vitus.com")).ReturnsAsync(usuario);
            _medicoRepoMock.Setup(r => r.GetAll()).ReturnsAsync(new List<Medico> { medico });

            var resultado = await _useCase.Execute(Request());

            resultado.MedicoId.Should().Be(medico.Id.ToString());
        }

        [Fact]
        public async Task Execute_Fail_UsuarioNaoEncontrado()
        {
            _usuarioRepoMock.Setup(r => r.GetByEmail(It.IsAny<string>())).ReturnsAsync((Usuario?)null);

            var act = async () => await _useCase.Execute(Request());

            await act.Should().ThrowAsync<DomainException>().WithMessage("Email ou senha inválidos");
        }

        [Fact]
        public async Task Execute_Fail_SenhaIncorreta()
        {
            var usuario = UsuarioAprovado();
            _usuarioRepoMock.Setup(r => r.GetByEmail("maria@vitus.com")).ReturnsAsync(usuario);

            var act = async () => await _useCase.Execute(Request(senha: "SenhaErrada@1"));

            await act.Should().ThrowAsync<DomainException>().WithMessage("Email ou senha inválidos");
            _tokenServiceMock.Verify(t => t.Generate(It.IsAny<Usuario>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Fail_CadastroPendente()
        {
            var pendente = new Usuario("Maria", "maria@vitus.com",
                BCrypt.Net.BCrypt.HashPassword(SenhaCorreta), PerfilUsuario.Recepcionista);
            _usuarioRepoMock.Setup(r => r.GetByEmail("maria@vitus.com")).ReturnsAsync(pendente);

            var act = async () => await _useCase.Execute(Request());

            await act.Should().ThrowAsync<DomainException>().WithMessage("*aguarda aprovação*");
            _tokenServiceMock.Verify(t => t.Generate(It.IsAny<Usuario>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Fail_CadastroRecusado()
        {
            var recusado = new Usuario("Maria", "maria@vitus.com",
                BCrypt.Net.BCrypt.HashPassword(SenhaCorreta), PerfilUsuario.Recepcionista);
            recusado.Recusar();
            _usuarioRepoMock.Setup(r => r.GetByEmail("maria@vitus.com")).ReturnsAsync(recusado);

            var act = async () => await _useCase.Execute(Request());

            await act.Should().ThrowAsync<DomainException>().WithMessage("*não foi aprovado*");
            _tokenServiceMock.Verify(t => t.Generate(It.IsAny<Usuario>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Fail_ContaBloqueada_NemConsultaOBanco()
        {
            _trackerMock.Setup(t => t.TempoRestanteBloqueio("maria@vitus.com"))
                .Returns(TimeSpan.FromMinutes(10));

            var act = async () => await _useCase.Execute(Request());

            await act.Should().ThrowAsync<TentativasExcedidasException>();
            _usuarioRepoMock.Verify(r => r.GetByEmail(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Fail_SenhaIncorreta_RegistraFalha()
        {
            _usuarioRepoMock.Setup(r => r.GetByEmail("maria@vitus.com")).ReturnsAsync(UsuarioAprovado());

            var act = async () => await _useCase.Execute(Request(senha: "Errada@123"));

            await act.Should().ThrowAsync<DomainException>();
            _trackerMock.Verify(t => t.RegistrarFalha("maria@vitus.com"), Times.Once);
        }

        [Fact]
        public async Task Execute_Fail_EmailInexistente_RegistraFalha()
        {
            _usuarioRepoMock.Setup(r => r.GetByEmail(It.IsAny<string>())).ReturnsAsync((Usuario?)null);

            var act = async () => await _useCase.Execute(Request());

            await act.Should().ThrowAsync<DomainException>();
            _trackerMock.Verify(t => t.RegistrarFalha("maria@vitus.com"), Times.Once);
        }

        [Fact]
        public async Task Execute_Success_LimpaContadorDeFalhas()
        {
            _usuarioRepoMock.Setup(r => r.GetByEmail("maria@vitus.com")).ReturnsAsync(UsuarioAprovado());

            await _useCase.Execute(Request());

            _trackerMock.Verify(t => t.Limpar("maria@vitus.com"), Times.Once);
        }
    }
}