using Vitus.Communication.Auth.Requests;
using Vitus.Communication.Auth.Responses;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.Registrar
{
    public class RegistrarUsuarioUseCase
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IMedicoRepository _medicoRepository;
        private readonly ITokenService _tokenService;

        public RegistrarUsuarioUseCase(
            IUsuarioRepository usuarioRepository,
            IMedicoRepository medicoRepository,
            ITokenService tokenService)
        {
            _usuarioRepository = usuarioRepository;
            _medicoRepository = medicoRepository;
            _tokenService = tokenService;
        }

        public async Task<AuthResponseJson> Execute(RegisterRequestJson request)
        {
            var usuarioExistente = await _usuarioRepository.GetByEmail(request.Email);

            if (usuarioExistente != null)
                throw new DomainException("Email já cadastrado");

            if (!Enum.TryParse<PerfilUsuario>(request.Perfil, ignoreCase: true, out var perfil))
                throw new DomainException("Perfil inválido. Use: Medico, Enfermeiro, Recepcionista ou Paciente");

            var senhaHash = BCrypt.Net.BCrypt.HashPassword(request.Senha);
            var usuario = new Usuario(request.Nome, request.Email, senhaHash, perfil);
            await _usuarioRepository.Add(usuario);

            if (perfil == PerfilUsuario.Medico)
            {
                var crm = request.CRM ?? $"CRM-PROVISÓRIO-{Guid.NewGuid().ToString()[..8].ToUpper()}";
                var especialidade = request.Especialidade ?? "Clínico Geral";
                var medico = new Medico(request.Nome, especialidade, crm);
                await _medicoRepository.Add(medico);
            }

            var token = _tokenService.Generate(usuario);

            return new AuthResponseJson
            {
                Token = token,
                Nome = usuario.Nome,
                Email = usuario.Email,
                Perfil = usuario.Perfil.ToString()
            };
        }
    }
}