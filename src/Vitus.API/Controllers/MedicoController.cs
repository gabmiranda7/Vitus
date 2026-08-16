using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vitus.Application.UseCases.Medicos.GetAllMedicos;
using Vitus.Application.UseCases.Medicos.GetMedicoById;

namespace Vitus.API.Controllers
{
    [ApiController]
    [Route("api/medicos")]
    [Authorize(Roles = "Recepcionista")]
    public class MedicoController : ControllerBase
    {
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