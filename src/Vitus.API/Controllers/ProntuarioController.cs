using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vitus.Application.UseCases.Prontuarios.GetAcompanhamentoReceitas;
using Vitus.Application.UseCases.Prontuarios.GetProntuarioByConsultaId;
using Vitus.Application.UseCases.Prontuarios.GetProntuarioById;
using Vitus.Application.UseCases.Prontuarios.GetProntuarioByPacienteId;

namespace Vitus.API.Controllers
{
    [ApiController]
    [Route("api/prontuarios")]
    [Authorize(Roles = "Medico,Enfermeiro")]
    public class ProntuarioController : ControllerBase
    {
        [HttpGet("acompanhamento")]
        public async Task<IActionResult> GetAcompanhamento(
            [FromServices] GetAcompanhamentoReceitasUseCase useCase)
        {
            var result = await useCase.Execute();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(
            [FromServices] GetProntuarioByIdUseCase useCase,
            Guid id)
        {
            var response = await useCase.Execute(id);
            return Ok(response);
        }

        [HttpGet("consulta/{consultaId}")]
        public async Task<IActionResult> GetByConsultaId(
            [FromServices] GetProntuarioByConsultaIdUseCase useCase,
            Guid consultaId)
        {
            var result = await useCase.Execute(consultaId);
            return Ok(result);
        }

        [HttpGet("paciente/{pacienteId}")]
        public async Task<IActionResult> GetByPacienteId(
            [FromServices] GetProntuarioByPacienteIdUseCase useCase,
            Guid pacienteId)
        {
            var result = await useCase.Execute(pacienteId);
            return Ok(result);
        }
    }
}