using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vitus.Application.UseCases.Exames.AnexarArquivo;
using Vitus.Application.UseCases.Exames.DownloadArquivo;
using Vitus.Application.UseCases.Exames.GetExamesByProntuario;
using Vitus.Application.UseCases.Exames.RegistrarExame;
using Vitus.Communication.Exame.Requests;

namespace Vitus.API.Controllers
{
    [ApiController]
    [Route("api/exames")]
    [Authorize(Roles = "Medico,Enfermeiro")]
    public class ExameController : ControllerBase
    {
        [HttpPost]
        [Authorize(Roles = "Medico")]
        public async Task<IActionResult> Registrar(
            [FromServices] RegistrarExameUseCase useCase,
            [FromBody] CreateExameRequestJson request)
        {
            var response = await useCase.Execute(request);
            return Created(string.Empty, response);
        }

        [HttpGet("prontuario/{prontuarioId}")]
        public async Task<IActionResult> GetByProntuario(
            [FromServices] GetExamesByProntuarioUseCase useCase,
            Guid prontuarioId)
        {
            var response = await useCase.Execute(prontuarioId);
            return Ok(response);
        }

        [HttpPost("{id}/arquivo")]
        [Authorize(Roles = "Medico")]
        public async Task<IActionResult> AnexarArquivo(
            [FromServices] AnexarArquivoExameUseCase useCase,
            Guid id,
            IFormFile arquivo)
        {
            var response = await useCase.Execute(id, arquivo);
            return Ok(response);
        }

        [HttpGet("{id}/arquivo")]
        public async Task<IActionResult> DownloadArquivo(
            [FromServices] DownloadArquivoExameUseCase useCase,
            Guid id)
        {
            var resultado = await useCase.Execute(id);
            return File(resultado.Conteudo, resultado.ContentType, resultado.NomeArquivo);
        }
    }
}