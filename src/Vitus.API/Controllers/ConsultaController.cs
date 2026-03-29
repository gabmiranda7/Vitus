using Microsoft.AspNetCore.Mvc;
using Vitus.Application.UseCases.Consultas.CreateConsulta;
using Vitus.Communication.Consulta.Requests;

namespace Vitus.API.Controllers
{
    [ApiController]
    [Route("api/consultas")]
    public class ConsultaController : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromServices] CreateConsultaUseCase useCase,
            [FromBody] CreateConsultaRequestJson request)
        {
            var response = await useCase.Execute(request);

            return Created(string.Empty, response);
        }
    }
}