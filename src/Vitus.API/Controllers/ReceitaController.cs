using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vitus.Application.UseCases.Receitas.GerarReceita;
using Vitus.Communication.Receita.Requests;

namespace Vitus.API.Controllers
{
    [ApiController]
    [Route("api/receitas")]
    [Authorize(Roles = "Medico")]
    public class ReceitaController : ControllerBase
    {
        [HttpPost("gerar")]
        public async Task<IActionResult> Gerar(
            [FromServices] GerarReceitaUseCase useCase,
            [FromBody] GerarReceitaRequestJson request)
        {
            var (arquivo, nomeArquivo) = await useCase.Execute(request);
            return File(
                arquivo,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                nomeArquivo);
        }
    }
}