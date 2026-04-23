using Microsoft.AspNetCore.Mvc;
using Vitus.Application.UseCases.Auth.Login;
using Vitus.Application.UseCases.Auth.Registrar;
using Vitus.Communication.Auth.Requests;

namespace Vitus.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        [HttpPost("registrar")]
        public async Task<IActionResult> Registrar(
            [FromServices] RegistrarUsuarioUseCase useCase,
            [FromBody] RegisterRequestJson request)
        {
            var response = await useCase.Execute(request);
            return Created(string.Empty, response);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(
            [FromServices] LoginUsuarioUseCase useCase,
            [FromBody] LoginRequestJson request)
        {
            var response = await useCase.Execute(request);
            return Ok(response);
        }
    }
}