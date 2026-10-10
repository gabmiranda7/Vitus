using FluentAssertions;
using Moq;
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
        private readonly Mock<IUsuarioRepository> _usuarioRepoMock = new();
        private readonly Mock<IEnfermeiroRepository> _enfermeiroRepoMock = new();
        private readonly Mock<IMedicoRepository> _medicoRepoMock = new();
        private readonly RegistrarUsuarioUseCase _useCase;

        public RegistrarUsuarioUseCaseTests()
        {
            _useCase = new RegistrarUsuarioUseCase(
                _usuarioRepoMock.Object,
                _enfermeiroRepoMock.Object,
                _medicoRepoMock.Object);
        }

        private static RegisterRequestJson Request(string perfil, string email = "novo@vitus.com") => new()
        {
            Nome = "Fulano de Tal",
            Email = email,
            Senha = "Senha@123",
            Perfil = perfil,
            CRM = "CRM-MG 12345",
            Especialidade = "Cardiologia",
            COREN = "COREN-MG 123456",
            Especializacao = "UTI"
        };

        [Fact]
        public async Task Execute_Success_Recepcionista_FicaPendente()
        {
            var resultado = await _useCase.Execute(Request("Recepcionista"));

            resultado.Mensagem.Should().Contain("aprovação");
            _usuarioRepoMock.Verify(r => r.Add(It.Is<Usuario>(u =>
                u.Perfil == PerfilUsuario.Recepcionista &&
                u.Status == StatusUsuario.Pendente)), Times.Once);
            _medicoRepoMock.Verify(r => r.Add(It.IsAny<Medico>()), Times.Never);
            _enfermeiroRepoMock.Verify(r => r.Add(It.IsAny<Enfermeiro>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Success_Medico_CriaMedico()
        {
            await _useCase.Execute(Request("Medico"));

            _usuarioRepoMock.Verify(r => r.Add(It.Is<Usuario>(u =>
                u.Status == StatusUsuario.Pendente)), Times.Once);
            _medicoRepoMock.Verify(r => r.Add(It.IsAny<Medico>()), Times.Once);
        }

        [Fact]
        public async Task Execute_Success_Enfermeiro_CriaEnfermeiro()
        {
            await _useCase.Execute(Request("Enfermeiro"));

            _usuarioRepoMock.Verify(r => r.Add(It.IsAny<Usuario>()), Times.Once);
            _enfermeiroRepoMock.Verify(r => r.Add(It.IsAny<Enfermeiro>()), Times.Once);
        }

        [Fact]
        public async Task Execute_Success_NormalizaEmailParaMinusculo()
        {
            await _useCase.Execute(Request("Recepcionista", "  NOVO@Vitus.COM "));

            _usuarioRepoMock.Verify(r => r.Add(It.Is<Usuario>(u =>
                u.Email == "novo@vitus.com")), Times.Once);
        }

        [Fact]
        public async Task Execute_Fail_EmailJaCadastrado()
        {
            var existente = new Usuario("Já Existe", "novo@vitus.com", "hash", PerfilUsuario.Recepcionista);
            _usuarioRepoMock.Setup(r => r.GetByEmail("novo@vitus.com")).ReturnsAsync(existente);

            var act = async () => await _useCase.Execute(Request("Recepcionista"));

            await act.Should().ThrowAsync<DomainException>().WithMessage("Email já cadastrado");
            _usuarioRepoMock.Verify(r => r.Add(It.IsAny<Usuario>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Fail_PerfilAdministradorBloqueado()
        {
            var act = async () => await _useCase.Execute(Request("Administrador"));

            await act.Should().ThrowAsync<DomainException>()
                .WithMessage("Não é possível se cadastrar como Administrador");
            _usuarioRepoMock.Verify(r => r.Add(It.IsAny<Usuario>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Fail_PerfilPacienteBloqueado()
        {
            var act = async () => await _useCase.Execute(Request("Paciente"));

            await act.Should().ThrowAsync<DomainException>();
            _usuarioRepoMock.Verify(r => r.Add(It.IsAny<Usuario>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Fail_PerfilInvalido()
        {
            var act = async () => await _useCase.Execute(Request("Inexistente"));

            await act.Should().ThrowAsync<DomainException>();
        }
    }
}