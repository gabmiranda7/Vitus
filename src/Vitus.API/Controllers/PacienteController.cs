using Microsoft.AspNetCore.Mvc;
using Vitus.Application.UseCases.Pacientes.CreatePaciente;
using Vitus.Application.UseCases.Pacientes.DeletePaciente;
using Vitus.Application.UseCases.Pacientes.GetAllPacientes;
using Vitus.Application.UseCases.Pacientes.GetPacienteById;
using Vitus.Application.UseCases.Pacientes.UpdatePaciente;
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

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            [FromServices] UpdatePacienteUseCase useCase,
            Guid id,
            [FromBody] UpdatePacienteRequestJson request)
        {
            await useCase.Execute(id, request);

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(
            [FromServices] DeletePacienteUseCase useCase,
            Guid id)
        {
            await useCase.Execute(id);

            return NoContent();
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(
            [FromServices] GetPacienteByIdUseCase useCase,
            Guid id)
        {
            var response = await useCase.Execute(id);

            if (response == null)
                return NotFound();

            return Ok(response);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromServices] GetAllPacientesUseCase useCase)
        {
            var response = await useCase.Execute();

            return Ok(response);
        } 
    }
}