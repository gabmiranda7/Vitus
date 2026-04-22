using Microsoft.AspNetCore.Mvc;
using Vitus.Application.UseCases.Triagens.RegistrarTriagem;
using Vitus.Communication.Triagem.Requests;

namespace Vitus.API.Controllers
{
    [ApiController]
    [Route("api/triagens")]
    public class TriagemController : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> Registrar(
            [FromServices] RegistrarTriagemUseCase useCase,
            [FromBody] CreateTriagemRequestJson request)
        {
            var response = await useCase.Execute(request);

            return Created(string.Empty, response);
        }
    }
}