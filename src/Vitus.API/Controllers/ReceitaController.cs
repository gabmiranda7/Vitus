using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vitus.Application.UseCases.Receitas.CriarReceita;
using Vitus.Communication.Receita.Requests;

namespace Vitus.API.Controllers
{
    [ApiController]
    [Route("api/receitas")]
    [Authorize(Roles = "Medico")]
    public class ReceitaController : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> Criar(
            [FromServices] CriarReceitaUseCase useCase,
            [FromBody] CreateReceitaRequestJson request)
        {
            var response = await useCase.Execute(request);
            return Created(string.Empty, response);
        }
    }
}