using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vitus.Application.UseCases.Consultas.AguardarAtendimento;
using Vitus.Application.UseCases.Consultas.AnotarConsulta;
using Vitus.Application.UseCases.Consultas.CancelarConsulta;
using Vitus.Application.UseCases.Consultas.CreateConsulta;
using Vitus.Application.UseCases.Consultas.FinalizarConsulta;
using Vitus.Application.UseCases.Consultas.GetAllConsultas;
using Vitus.Application.UseCases.Consultas.GetConsultaById;
using Vitus.Application.UseCases.Consultas.IniciarAtendimento;
using Vitus.Application.UseCases.Consultas.IniciarTriagem;
using Vitus.Communication.Consulta.Requests;

namespace Vitus.API.Controllers
{
    [ApiController]
    [Route("api/consultas")]
    [Authorize]
    public class ConsultaController : ControllerBase
    {
        [HttpPost]
        [Authorize(Roles = "Recepcionista")]
        public async Task<IActionResult> Create(
            [FromServices] CreateConsultaUseCase useCase,
            [FromBody] CreateConsultaRequestJson request)
        {
            var response = await useCase.Execute(request);
            return Created(string.Empty, response);
        }

        [HttpGet]
        [Authorize(Roles = "Recepcionista,Enfermeiro,Medico")]
        public async Task<IActionResult> GetAll(
            [FromServices] GetAllConsultasUseCase useCase)
        {
            var result = await useCase.Execute();
            return Ok(result);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Recepcionista,Enfermeiro,Medico")]
        public async Task<IActionResult> GetById(
            [FromServices] GetConsultaByIdUseCase useCase,
            Guid id)
        {
            var result = await useCase.Execute(id);
            if (result == null)
                return NotFound();
            return Ok(result);
        }

        [HttpPatch("{id}/iniciar-triagem")]
        [Authorize(Roles = "Enfermeiro")]
        public async Task<IActionResult> IniciarTriagem(
            [FromServices] IniciarTriagemUseCase useCase,
            Guid id)
        {
            var result = await useCase.Execute(id);
            return Ok(result);
        }

        [HttpPatch("{id}/aguardar-atendimento")]
        [Authorize(Roles = "Enfermeiro")]
        public async Task<IActionResult> AguardarAtendimento(
            [FromServices] AguardarAtendimentoUseCase useCase,
            Guid id)
        {
            var result = await useCase.Execute(id);
            return Ok(result);
        }

        [HttpPatch("{id}/iniciar-atendimento")]
        [Authorize(Roles = "Medico")]
        public async Task<IActionResult> IniciarAtendimento(
            [FromServices] IniciarAtendimentoUseCase useCase,
            Guid id)
        {
            var result = await useCase.Execute(id);
            return Ok(result);
        }

        [HttpPatch("{id}/anotar")]
        [Authorize(Roles = "Medico")]
        public async Task<IActionResult> Anotar(
        [FromServices] AnotarConsultaUseCase useCase,Guid id,
        [FromBody] AnotarConsultaRequestJson request)
        {
            var result = await useCase.Execute(id, request);
            return Ok(result);
        }

        [HttpPatch("{id}/finalizar")]
        [Authorize(Roles = "Medico")]
        public async Task<IActionResult> Finalizar(
            [FromServices] FinalizarConsultaUseCase useCase,
            Guid id)
        {
            var result = await useCase.Execute(id);
            return Ok(result);
        }

        [HttpPatch("{id}/cancelar")]
        [Authorize(Roles = "Recepcionista,Medico")]
        public async Task<IActionResult> Cancelar(
            [FromServices] CancelarConsultaUseCase useCase,
            Guid id)
        {
            var result = await useCase.Execute(id);
            return Ok(result);
        }
    }
}