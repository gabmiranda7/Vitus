using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Vitus.Application.UseCases.Auth.AprovarUsuario;
using Vitus.Application.UseCases.Auth.GetUsuariosPendentes;
using Vitus.Application.UseCases.Auth.Login;
using Vitus.Application.UseCases.Auth.ObterUsuarioLogado;
using Vitus.Application.UseCases.Auth.RecusarUsuario;
using Vitus.Application.UseCases.Auth.Registrar;
using Vitus.Communication.Auth.Requests;

namespace Vitus.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        [HttpPost("registrar")]
        [AllowAnonymous]
        [EnableRateLimiting("registro")]
        public async Task<IActionResult> Registrar(
            [FromServices] RegistrarUsuarioUseCase useCase,
            [FromBody] RegisterRequestJson request)
        {
            var response = await useCase.Execute(request);
            return Created(string.Empty, response);
        }

        [HttpPost("login")]
        [AllowAnonymous]
        [EnableRateLimiting("login")]
        public async Task<IActionResult> Login(
            [FromServices] LoginUsuarioUseCase useCase,
            [FromBody] LoginRequestJson request)
        {
            var response = await useCase.Execute(request);
            return Ok(response);
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me(
            [FromServices] ObterUsuarioLogadoUseCase useCase)
        {
            var email = User.FindFirstValue(ClaimTypes.Email);

            if (string.IsNullOrEmpty(email))
                return Unauthorized();

            var response = await useCase.Execute(email);
            return Ok(response);
        }

        [HttpGet("pendentes")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Pendentes(
            [FromServices] GetUsuariosPendentesUseCase useCase)
        {
            var response = await useCase.Execute();
            return Ok(response);
        }

        [HttpPatch("{id}/aprovar")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Aprovar(
            [FromServices] AprovarUsuarioUseCase useCase,
            Guid id)
        {
            await useCase.Execute(id);
            return NoContent();
        }

        [HttpPatch("{id}/recusar")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Recusar(
            [FromServices] RecusarUsuarioUseCase useCase,
            Guid id)
        {
            await useCase.Execute(id);
            return NoContent();
        }
    }
}