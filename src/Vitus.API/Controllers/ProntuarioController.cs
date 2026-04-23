using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vitus.Application.UseCases.Prontuarios.GetProntuarioById;

namespace Vitus.API.Controllers
{
    [ApiController]
    [Route("api/prontuarios")]
    [Authorize(Roles = "Medico,Enfermeiro")]
    public class ProntuarioController : ControllerBase
    {
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(
            [FromServices] GetProntuarioByIdUseCase useCase,
            Guid id)
        {
            var response = await useCase.Execute(id);
            return Ok(response);
        }
    }
}