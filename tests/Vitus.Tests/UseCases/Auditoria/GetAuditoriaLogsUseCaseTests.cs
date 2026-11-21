using FluentAssertions;
using Moq;
using Vitus.Application.UseCases.Auditoria.GetAuditoriaLogs;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Interfaces;

namespace Vitus.Tests.UseCases.Auditoria
{
    public class GetAuditoriaLogsUseCaseTests
    {
        private readonly Mock<IAuditoriaRepository> _repoMock = new();
        private readonly GetAuditoriaLogsUseCase _useCase;

        public GetAuditoriaLogsUseCaseTests()
        {
            _useCase = new GetAuditoriaLogsUseCase(_repoMock.Object);
        }

        [Fact]
        public async Task Execute_RepassaFiltrosAoRepositorioEMapeiaOResultado()
        {
            var usuarioId = Guid.NewGuid();
            var inicio = new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc);
            var fim = new DateTime(2026, 11, 30, 23, 59, 59, DateTimeKind.Utc);
            var log = new AuditoriaLog(usuarioId, "Maria", AcaoAuditoria.LoginSucesso, "Usuario", Guid.NewGuid(), "ok");

            _repoMock.Setup(r => r.Buscar(usuarioId, "Usuario", inicio, fim))
                .ReturnsAsync(new List<AuditoriaLog> { log });

            var resultado = await _useCase.Execute(usuarioId, "Usuario", inicio, fim);

            resultado.Should().ContainSingle();
            resultado[0].UsuarioNome.Should().Be("Maria");
            resultado[0].Acao.Should().Be("LoginSucesso");
            _repoMock.Verify(r => r.Buscar(usuarioId, "Usuario", inicio, fim), Times.Once);
        }
    }
}