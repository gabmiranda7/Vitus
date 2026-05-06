using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vitus.Application.UseCases.Triagens.RegistrarTriagem;
using Vitus.Communication.Triagem.Requests;

namespace Vitus.API.Controllers
{
    [ApiController]
    [Route("api/triagens")]
    [Authorize(Roles = "Enfermeiro")]
    public class TriagemController : ControllerBase
    {
        [HttpPost]
        [Authorize(Roles = "Enfermeiro")]
        public async Task<IActionResult> Registrar(
            [FromServices] RegistrarTriagemUseCase useCase,
            [FromBody] CreateTriagemRequestJson request)
        {
            var nomeEnfermeiro = User.FindFirst("name")?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
                ?? "Enfermeiro";

            var result = await useCase.Execute(request, nomeEnfermeiro);
            return Ok(result);
        }
    }
}