using Moq;
using FluentAssertions;
using Vitus.Application.UseCases.Auth.Registrar;
using Vitus.Communication.Auth.Requests;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Tests.UseCases.Auth
{
    public class RegistrarUsuarioUseCaseTests
    {
        private readonly Mock<IUsuarioRepository> _usuarioRepoMock;
        private readonly Mock<IMedicoRepository> _medicoRepoMock;
        private readonly Mock<ITokenService> _tokenServiceMock;
        private readonly RegistrarUsuarioUseCase _useCase;

        public RegistrarUsuarioUseCaseTests()
        {
            _usuarioRepoMock = new Mock<IUsuarioRepository>();
            _medicoRepoMock = new Mock<IMedicoRepository>();
            _tokenServiceMock = new Mock<ITokenService>();
            _useCase = new RegistrarUsuarioUseCase(
                _usuarioRepoMock.Object,
                _medicoRepoMock.Object,
                _tokenServiceMock.Object
            );
        }

        private static RegisterRequestJson RequestValido(
            string nome = "Carlos",
            string email = "carlos@email.com",
            string senha = "senha123",
            string perfil = "Medico",
            string? crm = "CRM-MG 12345",
            string? especialidade = "Cardiologia") => new()
            {
                Nome = nome,
                Email = email,
                Senha = senha,
                Perfil = perfil,
                CRM = crm,
                Especialidade = especialidade
            };

        [Fact]
        public async Task Execute_Success_Medico()
        {
            _usuarioRepoMock.Setup(r => r.GetByEmail(It.IsAny<string>()))
                .ReturnsAsync((Usuario?)null);
            _tokenServiceMock.Setup(t => t.Generate(It.IsAny<Usuario>()))
                .Returns("token_valido");

            var request = RequestValido();

            var resultado = await _useCase.Execute(request);

            resultado.Should().NotBeNull();
            resultado.Token.Should().Be("token_valido");
            resultado.Nome.Should().Be("Carlos");
            resultado.Perfil.Should().Be("Medico");

            _usuarioRepoMock.Verify(r => r.Add(It.IsAny<Usuario>()), Times.Once);
            _medicoRepoMock.Verify(r => r.Add(It.IsAny<Medico>()), Times.Once);
        }

        [Fact]
        public async Task Execute_Success_Enfermeiro_NaoCriaMedico()
        {
            _usuarioRepoMock.Setup(r => r.GetByEmail(It.IsAny<string>()))
                .ReturnsAsync((Usuario?)null);
            _tokenServiceMock.Setup(t => t.Generate(It.IsAny<Usuario>()))
                .Returns("token_valido");

            var request = RequestValido(perfil: "Enfermeiro", crm: null, especialidade: null);

            var resultado = await _useCase.Execute(request);

            resultado.Perfil.Should().Be("Enfermeiro");
            _medicoRepoMock.Verify(r => r.Add(It.IsAny<Medico>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Success_Recepcionista_NaoCriaMedico()
        {
            _usuarioRepoMock.Setup(r => r.GetByEmail(It.IsAny<string>()))
                .ReturnsAsync((Usuario?)null);
            _tokenServiceMock.Setup(t => t.Generate(It.IsAny<Usuario>()))
                .Returns("token_valido");

            var request = RequestValido(perfil: "Recepcionista", crm: null, especialidade: null);

            var resultado = await _useCase.Execute(request);

            resultado.Perfil.Should().Be("Recepcionista");
            _medicoRepoMock.Verify(r => r.Add(It.IsAny<Medico>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Success_Medico_SemCRM_GeraProvisorio()
        {
            _usuarioRepoMock.Setup(r => r.GetByEmail(It.IsAny<string>()))
                .ReturnsAsync((Usuario?)null);
            _tokenServiceMock.Setup(t => t.Generate(It.IsAny<Usuario>()))
                .Returns("token_valido");

            var request = RequestValido(crm: null, especialidade: null);

            var resultado = await _useCase.Execute(request);

            resultado.Perfil.Should().Be("Medico");
            _medicoRepoMock.Verify(r => r.Add(It.Is<Medico>(m =>
                m.CRM.StartsWith("CRM-PROVISÓRIO-") &&
                m.Especialidade == "Clínico Geral"
            )), Times.Once);
        }

        [Fact]
        public async Task Execute_Fail_EmailJaCadastrado()
        {
            var usuarioExistente = new Usuario("Outro", "carlos@email.com",
                BCrypt.Net.BCrypt.HashPassword("outrasenha"),
                PerfilUsuario.Recepcionista);

            _usuarioRepoMock.Setup(r => r.GetByEmail("carlos@email.com"))
                .ReturnsAsync(usuarioExistente);

            var act = async () => await _useCase.Execute(RequestValido());

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Email já cadastrado");
        }

        [Fact]
        public async Task Execute_Fail_PerfilInvalido()
        {
            _usuarioRepoMock.Setup(r => r.GetByEmail(It.IsAny<string>()))
                .ReturnsAsync((Usuario?)null);

            var request = RequestValido(perfil: "PerfilInexistente");

            var act = async () => await _useCase.Execute(request);

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Perfil inválido. Use: Medico, Enfermeiro, Recepcionista ou Paciente");
        }
    }
}