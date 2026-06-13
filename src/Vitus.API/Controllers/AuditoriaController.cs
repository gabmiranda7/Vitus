using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vitus.Application.UseCases.Auditoria.GetAuditoriaLogs;

namespace Vitus.API.Controllers
{
    [ApiController]
    [Route("api/auditoria")]
    [Authorize(Roles = "Administrador")]
    public class AuditoriaController : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromServices] GetAuditoriaLogsUseCase useCase,
            [FromQuery] Guid? usuarioId,
            [FromQuery] string? entidadeAfetada,
            [FromQuery] DateTime? dataInicio,
            [FromQuery] DateTime? dataFim)
        {
            var result = await useCase.Execute(usuarioId, entidadeAfetada, dataInicio, dataFim);
            return Ok(result);
        }
    }
}