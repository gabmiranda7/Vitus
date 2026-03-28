using Microsoft.AspNetCore.Mvc;
using Vitus.Application.UseCases.Pacientes.CreatePaciente;
using Vitus.Communication.Paciente.Requests;
using Vitus.Communication.Paciente.Responses;
namespace Vitus.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PacienteController : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromServices] CreatePacienteUseCase useCase,
            [FromBody] CreatePacienteRequestJson request)
        {
            var response = await useCase.Execute(request);

            return Created(string.Empty, response);
        }
    }
}