using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vitus.Application.UseCases.Prontuarios.GetProntuarioById;
using Vitus.Application.UseCases.Prontuarios.GetProntuarioByPacienteId;

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

        [HttpGet("paciente/{pacienteId}")]
        public async Task<IActionResult> GetByPacienteId(
            [FromServices] GetProntuarioByPacienteIdUseCase useCase,
            Guid pacienteId)
        {
            var response = await useCase.Execute(pacienteId);
            return Ok(response);
        }
    }
}