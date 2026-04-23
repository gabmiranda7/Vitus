using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vitus.Application.UseCases.Medicos.CreateMedico;
using Vitus.Application.UseCases.Medicos.GetAllMedicos;
using Vitus.Application.UseCases.Medicos.GetMedicoById;
using Vitus.Communication.Medico.Requests;

namespace Vitus.API.Controllers
{
    [ApiController]
    [Route("api/medicos")]
    [Authorize(Roles = "Recepcionista")]
    public class MedicoController : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromServices] CreateMedicoUseCase useCase,
            [FromBody] CreateMedicoRequestJson request)
        {
            await useCase.Execute(request);
            return Created(string.Empty, null);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromServices] GetAllMedicosUseCase useCase)
        {
            var result = await useCase.Execute();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(
            [FromServices] GetMedicoByIdUseCase useCase,
            Guid id)
        {
            var result = await useCase.Execute(id);
            if (result == null)
                return NotFound();
            return Ok(result);
        }
    }
}