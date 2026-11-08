using FluentAssertions;
using Moq;
using Vitus.Application.UseCases.Auth.AtualizarPerfil;
using Vitus.Communication.Auth.Requests;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;
using Vitus.Tests.Helpers;

namespace Vitus.Tests.UseCases.Auth
{
    public class AtualizarPerfilUseCaseTests
    {
        private readonly Mock<IUsuarioRepository> _usuarioRepoMock = new();
        private readonly Mock<IMedicoRepository> _medicoRepoMock = new();
        private readonly Mock<ITokenService> _tokenMock = new();
        private readonly Mock<IAuditoriaService> _auditoriaMock = new();
        private readonly AtualizarPerfilUseCase _useCase;

        public AtualizarPerfilUseCaseTests()
        {
            _tokenMock.Setup(t => t.Generate(It.IsAny<Usuario>())).Returns("token-novo");
            _useCase = new AtualizarPerfilUseCase(
                _usuarioRepoMock.Object, _medicoRepoMock.Object, _tokenMock.Object, _auditoriaMock.Object);
        }

        [Fact]
        public async Task Execute_Success_AtualizaNomeEDevolveTokenNovo()
        {
            var usuario = new Usuario("Maria", "maria@vitus.com", "hash", PerfilUsuario.Recepcionista);
            _usuarioRepoMock.Setup(r => r.GetById(usuario.Id)).ReturnsAsync(usuario);

            var resultado = await _useCase.Execute(usuario.Id, new AtualizarPerfilRequestJson { Nome = "  Maria Souza " });

            resultado.Nome.Should().Be("Maria Souza");
            resultado.Token.Should().Be("token-novo");
            _usuarioRepoMock.Verify(r => r.Update(usuario), Times.Once);
            _medicoRepoMock.Verify(r => r.Update(It.IsAny<Medico>()), Times.Never);
        }

        [Fact]
        public async Task Execute_Success_Medico_AtualizaTambemOCadastroDeMedico()
        {
            var usuario = new Usuario("Dr. Carlos", "carlos@vitus.com", "hash", PerfilUsuario.Medico);
            var medico = EntidadeFactory.CriarMedico("Dr. Carlos", usuarioId: usuario.Id);
            _usuarioRepoMock.Setup(r => r.GetById(usuario.Id)).ReturnsAsync(usuario);
            _medicoRepoMock.Setup(r => r.GetByUsuarioId(usuario.Id)).ReturnsAsync(medico);

            var resultado = await _useCase.Execute(usuario.Id, new AtualizarPerfilRequestJson { Nome = "Dr. Carlos Lima" });

            medico.Nome.Should().Be("Dr. Carlos Lima");
            resultado.MedicoId.Should().Be(medico.Id.ToString());
            _medicoRepoMock.Verify(r => r.Update(medico), Times.Once);
        }

        [Fact]
        public async Task Execute_Fail_UsuarioNaoEncontrado()
        {
            _usuarioRepoMock.Setup(r => r.GetById(It.IsAny<Guid>())).ReturnsAsync((Usuario?)null);

            var act = async () => await _useCase.Execute(Guid.NewGuid(), new AtualizarPerfilRequestJson { Nome = "X" });

            await act.Should().ThrowAsync<DomainException>().WithMessage("Usuário não encontrado");
        }

        [Fact]
        public async Task Execute_Fail_NomeVazio()
        {
            var usuario = new Usuario("Maria", "maria@vitus.com", "hash", PerfilUsuario.Recepcionista);
            _usuarioRepoMock.Setup(r => r.GetById(usuario.Id)).ReturnsAsync(usuario);

            var act = async () => await _useCase.Execute(usuario.Id, new AtualizarPerfilRequestJson { Nome = "  " });

            await act.Should().ThrowAsync<DomainException>().WithMessage("Nome é obrigatório");
            _usuarioRepoMock.Verify(r => r.Update(It.IsAny<Usuario>()), Times.Never);
        }
    }
}