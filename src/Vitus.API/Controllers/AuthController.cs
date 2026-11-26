using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using Vitus.Application.UseCases.Auth.AlterarStatusUsuario;
using Vitus.Application.UseCases.Auth.AprovarUsuario;
using Vitus.Application.UseCases.Auth.AtualizarFotoPerfil;
using Vitus.Application.UseCases.Auth.AtualizarPerfil;
using Vitus.Application.UseCases.Auth.GetAllUsuarios;
using Vitus.Application.UseCases.Auth.GetUsuariosPendentes;
using Vitus.Application.UseCases.Auth.Login;
using Vitus.Application.UseCases.Auth.ObterFotoPerfil;
using Vitus.Application.UseCases.Auth.ObterUsuarioLogado;
using Vitus.Application.UseCases.Auth.RecusarUsuario;
using Vitus.Application.UseCases.Auth.RedefinirSenhaUsuario;
using Vitus.Application.UseCases.Auth.Registrar;
using Vitus.Application.UseCases.Auth.RemoverFotoPerfil;
using Vitus.Application.UseCases.Auth.SolicitarRedefinicaoSenha;
using Vitus.Application.UseCases.Auth.TrocarSenha;
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

        [HttpPost("esqueci-senha")]
        [AllowAnonymous]
        [EnableRateLimiting("esqueci-senha")]
        public async Task<IActionResult> EsqueciSenha(
            [FromServices] SolicitarRedefinicaoSenhaUseCase useCase,
            [FromBody] EsqueciSenhaRequestJson request)
        {
            await useCase.Execute(request);
            return Ok(new
            {
                mensagem = "Se o e-mail estiver cadastrado, o administrador foi avisado e vai gerar uma senha temporária para você."
            });
        }

        [HttpPost("{id}/redefinir-senha")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> RedefinirSenha(
            [FromServices] RedefinirSenhaUsuarioUseCase useCase,
            Guid id)
        {
            var response = await useCase.Execute(id);
            return Ok(response);
        }

        [HttpPost("me/senha")]
        [Authorize]
        public async Task<IActionResult> TrocarSenha(
            [FromServices] TrocarSenhaUseCase useCase,
            [FromBody] TrocarSenhaRequestJson request)
        {
            var response = await useCase.Execute(UsuarioIdLogado(), request);
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

        [HttpGet("usuarios")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> ListarUsuarios(
            [FromServices] GetAllUsuariosUseCase useCase)
        {
            var response = await useCase.Execute();
            return Ok(response);
        }

        [HttpPatch("{id}/desativar")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Desativar(
            [FromServices] AlterarStatusUsuarioUseCase useCase,
            Guid id)
        {
            await useCase.Execute(id, ativar: false);
            return NoContent();
        }

        [HttpPatch("{id}/reativar")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Reativar(
            [FromServices] AlterarStatusUsuarioUseCase useCase,
            Guid id)
        {
            await useCase.Execute(id, ativar: true);
            return NoContent();
        }

        [HttpPut("me")]
        [Authorize]
        public async Task<IActionResult> AtualizarPerfil(
            [FromServices] AtualizarPerfilUseCase useCase,
            [FromBody] AtualizarPerfilRequestJson request)
        {
            var response = await useCase.Execute(UsuarioIdLogado(), request);
            return Ok(response);
        }

        [HttpGet("me/foto")]
        [Authorize]
        public async Task<IActionResult> ObterFoto(
            [FromServices] ObterFotoPerfilUseCase useCase)
        {
            var foto = await useCase.Execute(UsuarioIdLogado());

            if (foto == null)
                return NotFound();

            return File(foto.Conteudo, foto.ContentType);
        }

        [HttpPost("me/foto")]
        [Authorize]
        public async Task<IActionResult> AtualizarFoto(
            [FromServices] AtualizarFotoPerfilUseCase useCase,
            IFormFile arquivo)
        {
            await useCase.Execute(UsuarioIdLogado(), arquivo);
            return NoContent();
        }

        [HttpDelete("me/foto")]
        [Authorize]
        public async Task<IActionResult> RemoverFoto(
            [FromServices] RemoverFotoPerfilUseCase useCase)
        {
            await useCase.Execute(UsuarioIdLogado());
            return NoContent();
        }

        private Guid UsuarioIdLogado() =>
            Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : Guid.Empty;

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